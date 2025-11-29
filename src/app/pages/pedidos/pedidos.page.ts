import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton, AlertController, ModalController } from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Router } from '@angular/router';
import { DetallepedidoComponent } from '../../components/detallepedido/detallepedido.component';
import { NotificationsService } from '../../services/notifications.service';

interface Pedido {
  id: string;
  total: number;
  status: 'pendiente' | 'cancelado' | 'entregado' | 'en camino';
  createdAt: any;
  user: any;
  items: any;
  address: any;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton, CommonModule, FormsModule, FooterComponent]
})
export class PedidosPage implements OnInit, OnDestroy {
  pedidos: any[] = [];

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  ngOnDestroy() {
    this.notificationsService.stopListeningPedidos();
  }

  async cargarPedidos() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // iniciar escucha de pedidos para crear notificaciones de cambio de estado
      this.notificationsService.startListeningPedidos(user.uid);

      // asegurar bienvenida la primera vez que inicie sesión
      this.notificationsService.ensureWelcomeIfNeeded(user.uid, user.displayName ?? undefined);

      const db = getFirestore();
      const q = query(collection(db, 'pedidos'), where('user.uid', '==', user.uid));
      const querySnapshot = await getDocs(q);

      this.pedidos = querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: data['id'] || d.id,
          ...data
        };
      });

      // ordenar por fecha descendente
      this.pedidos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string,string> = {
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      entregado: 'Entregado',
      'en camino': 'En camino'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'pendiente': return 'status-pendiente';
      case 'en camino': return 'status-en-camino';
      case 'entregado': return 'status-entregado';
      case 'cancelado': return 'status-cancelado';
      default: return 'status-pendiente';
    }
  }

  formatDate(ts: any) {
    try {
      const d = ts?.toDate ? ts.toDate() : (new Date(ts));
      return d.toLocaleString();
    } catch {
      return '';
    }
  }

  async verDetalle(pedido: Pedido) {
    const modal = await this.modalCtrl.create({
      component: DetallepedidoComponent,
      componentProps: {
        pedido: pedido
      }
    });
    await modal.present();
  }
}
