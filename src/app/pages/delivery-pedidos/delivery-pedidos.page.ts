import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSpinner,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonLoading,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { Order, OrderStatus } from '../../models/orden.model';
import { TrackingService } from '../../services/tracking.service';
import { addIcons } from 'ionicons';
import { mapOutline, checkmarkDoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-delivery-pedidos',
  templateUrl: './delivery-pedidos.page.html',
  styleUrls: ['./delivery-pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonSpinner,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonLoading,
  ],
})
export class DeliveryPedidosPage implements OnInit, OnDestroy {
  pendingOrders: Order[] = [];
  acceptedOrders: Order[] = [];
  selectedTab: 'pending' | 'accepted' = 'pending';
  isLoading = false;
  activeDeliveryOrderId: string | null = null;

  private authUnsub?: () => void;
  private unsubscribe?: () => void;
  private currentUserId: string | null = null;

  constructor(
    private router: Router,
    private trackingService: TrackingService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ mapOutline, checkmarkDoneOutline });
  }

  ngOnInit() {
    const auth = getAuth();
    this.authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.currentUserId = user.uid;
      this.loadOrders();
    }) as unknown as () => void;
  }

  ngOnDestroy() {
    if (this.authUnsub) this.authUnsub();
    if (this.unsubscribe) this.unsubscribe();
    if (this.activeDeliveryOrderId) {
      this.trackingService.stopDeliveryTracking();
    }
  }

  /**
   * Cargar órdenes disponibles y aceptadas
   */
  private loadOrders() {
    if (!this.currentUserId) return;

    const db = getFirestore();

    // Órdenes pendientes (sin asignar) - sin orderBy para evitar índices
    const pendingQuery = query(
      collection(db, 'pedidos'),
      where('status', '==', 'pendiente')
    );

    // Órdenes aceptadas por este delivery - sin order by para evitar índices
    const acceptedQuery = query(
      collection(db, 'pedidos'),
      where('status', '==', 'en camino')
    );

    if (this.unsubscribe) this.unsubscribe();

    // Combinar listeners
    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        // Filtrar en el cliente para obtener solo los sin delivery asignado
        this.pendingOrders = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
          .filter((order) => !order.deliveryPerson)
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0)
          );
      },
      (error) => console.error('Error loading pending orders:', error)
    );

    const unsubscribeAccepted = onSnapshot(
      acceptedQuery,
      (snapshot) => {
        // Filtrar en el cliente para obtener solo los de este delivery
        // También incluir pedidos en estado 'pendiente' si fueron aceptados por este delivery
        this.acceptedOrders = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
          .filter(
            (order) =>
              order.deliveryPerson?.uid === this.currentUserId ||
              (order.status === 'pendiente' && order.deliveryPerson?.uid === this.currentUserId)
          );
      },
      (error) => console.error('Error loading accepted orders:', error)
    );

    // Guardar para limpiar luego
    this.unsubscribe = () => {
      unsubscribePending();
      unsubscribeAccepted();
    };
  }

  /**
   * Ver previsualizacion de pedido antes de aceptar
   */
  viewOrderPreview(orderId: string) {
    this.router.navigate(['/delivery-order-preview', orderId]);
  }

  /**
   * Aceptar una orden
   */
  async acceptOrder(order: Order) {
    if (!order.id || !this.currentUserId) return;

    const alert = await this.alertController.create({
      header: 'Aceptar Pedido',
      message: `¿Deseas aceptar este pedido? Total: $${order.total}`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: async () => {
            await this.confirmAcceptOrder(order);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Confirmar aceptación de orden
   */
  private async confirmAcceptOrder(order: Order) {
    if (!order.id || !this.currentUserId) return;

    this.isLoading = true;
    try {
      // Iniciar seguimiento de ubicación
      await this.trackingService.startDeliveryTracking(order.id);
      this.activeDeliveryOrderId = order.id;

      // Obtener datos del usuario actual
      const auth = getAuth();
      const currentUser = auth.currentUser;

      // Actualizar la orden
      const db = getFirestore();
      const orderRef = doc(db, 'pedidos', order.id);

      await updateDoc(orderRef, {
        deliveryPerson: {
          uid: this.currentUserId,
          displayName: currentUser?.displayName || 'Delivery',
          photoURL: currentUser?.photoURL || '',
          phone: currentUser?.phoneNumber || '',
        },
        status: 'en camino',
        acceptedAt: new Date(),
        estimatedDeliveryTime: 30, // Estimación por defecto
      });

      const toast = await this.toastController.create({
        message: 'Pedido aceptado exitosamente',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch (error) {
      console.error('Error accepting order:', error);
      const toast = await this.toastController.create({
        message: 'Error al aceptar el pedido',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Marcar orden como entregada
   */
  async markAsDelivered(order: Order) {
    if (!order.id) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Entrega',
      message: '¿Has entregado el pedido?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí, Entregar',
          handler: async () => {
            await this.confirmDelivery(order);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Confirmar entrega
   */
  private async confirmDelivery(order: Order) {
    if (!order.id) return;

    this.isLoading = true;
    try {
      const db = getFirestore();
      const orderRef = doc(db, 'pedidos', order.id);

      await updateDoc(orderRef, {
        status: 'entregado',
        updatedAt: new Date(),
      });

      if (this.activeDeliveryOrderId === order.id) {
        this.trackingService.stopDeliveryTracking();
        this.activeDeliveryOrderId = null;
      }

      const toast = await this.toastController.create({
        message: 'Pedido marcado como entregado',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      const toast = await this.toastController.create({
        message: 'Error al entregar el pedido',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Ver detalles de la orden y navegación
   */
  viewOrderTracking(orderId: string) {
    this.router.navigate(['/order-tracking', orderId]);
  }

  /**
   * Obtener cantidad de órdenes por estado
   */
  get pendingCount(): number {
    return this.pendingOrders.length;
  }

  get acceptedCount(): number {
    return this.acceptedOrders.length;
  }
}
