import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonBadge,
  IonSearchbar,
  IonChip,
  IonIcon,
  AlertController,
  ToastController,
  ModalController,
  IonModal,
  IonInput,
  IonLabel,
  IonItem,
  IonAccordion,
  IonAccordionGroup
} from '@ionic/angular/standalone';
import { IonMenuComponent } from '../../components/ion-menu/ion-menu.component';
import { Order, OrderStatus } from '../../models/orden.model';
import { OrdenService } from '../../services/orden.service';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';

@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './admin-pedidos.page.html',
  styleUrls: ['./admin-pedidos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonMenuComponent,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonBadge,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonModal,
    IonInput,
    IonLabel,
    IonItem,
    IonAccordion,
    IonAccordionGroup
  ]
})
export class AdminPedidosPage implements OnInit, OnDestroy {
  ordenes: Order[] = [];
  filteredOrdenes: Order[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus: OrderStatus | '' = '';
  editingOrden: Order | null = null;
  showEditModal = false;

  statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'en camino', label: '🚚 En camino' },
    { value: 'entregado', label: '✅ Entregado' },
    { value: 'cancelado', label: '❌ Cancelado' }
  ];

  constructor(
    private ordenService: OrdenService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {
    addIcons({ trash, create });
  }

  ngOnInit() {
    this.loadOrdenes();
  }

  ngOnDestroy() {
    this.ordenService.stopListening();
  }

  loadOrdenes() {
    this.loading = true;
    this.ordenService.getAllOrdenes().subscribe({
      next: (ordenes) => {
        this.ordenes = ordenes;
        this.filterOrdenes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ordenes:', error);
        this.loading = false;
        this.showToast('Error al cargar las órdenes', 'danger');
      }
    });
  }

  filterOrdenes() {
    let filtered = [...this.ordenes];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.user?.name?.toLowerCase().includes(search) ||
          o.user?.email?.toLowerCase().includes(search) ||
          o.user?.phone?.includes(search) ||
          o.id?.includes(search)
      );
    }

    // Filtrar por estado
    if (this.selectedStatus) {
      filtered = filtered.filter((o) => o.status === this.selectedStatus);
    }

    this.filteredOrdenes = filtered;
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value;
    this.filterOrdenes();
  }

  onStatusChange() {
    this.filterOrdenes();
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case 'pendiente':
        return 'warning';
      case 'en camino':
        return 'primary';
      case 'entregado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'medium';
    }
  }

  async editOrden(orden: Order) {
    this.editingOrden = { ...orden };
    this.showEditModal = true;
  }

  async saveOrdenChanges() {
    if (!this.editingOrden || !this.editingOrden.id) return;

    try {
      await this.ordenService.updateOrden(this.editingOrden.id, {
        status: this.editingOrden.status,
        notes: this.editingOrden.notes
      });
      this.showEditModal = false;
      this.editingOrden = null;
      this.showToast('Orden actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error updating orden:', error);
      this.showToast('Error al actualizar la orden', 'danger');
    }
  }

  async changeStatus(orden: Order, newStatus: OrderStatus) {
    try {
      await this.ordenService.updateOrderStatus(orden.id!, newStatus);
      this.showToast(`Orden marcada como ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error changing order status:', error);
      this.showToast('Error al cambiar el estado', 'danger');
    }
  }

  async deleteOrden(orden: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar orden',
      message: `¿Está seguro de que desea eliminar la orden #${orden.id}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.ordenService.deleteOrden(orden.id!);
              this.showToast('Orden eliminada correctamente', 'success');
            } catch (error) {
              console.error('Error deleting orden:', error);
              this.showToast('Error al eliminar la orden', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingOrden = null;
  }

  getTotalOrders(): number {
    return this.ordenes.length;
  }

  getPendingOrders(): number {
    return this.ordenes.filter((o) => o.status === 'pendiente').length;
  }

  getDeliveredOrders(): number {
    return this.ordenes.filter((o) => o.status === 'entregado').length;
  }
}
