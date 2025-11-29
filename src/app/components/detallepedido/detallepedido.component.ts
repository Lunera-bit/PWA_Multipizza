import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonCardHeader, IonList, IonItem, IonLabel, IonIcon, IonBackButton, AlertController, ModalController, ToastController } from '@ionic/angular/standalone';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-detallepedido',
  templateUrl: './detallepedido.component.html',
  styleUrls: ['./detallepedido.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonBackButton]
})
export class DetallepedidoComponent implements OnInit {
  @Input() pedido: any;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('mapContainer') mapContainer?: ElementRef;

  private map?: mapboxgl.Map;

  // Mapeo de tamaños
  private sizes = [
    { id: 'personal', label: 'Personal - S' },
    { id: 'mediana', label: 'Mediana - M' },
    { id: 'grande', label: 'Grande - L' },
    { id: 'familiar', label: 'Familiar - XL' }
  ];

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    mapboxgl.accessToken = environment.mapboxToken;
  }

  ngOnInit() {
  }

  getSizeLabel(sizeId: string): string {
    const size = this.sizes.find(s => s.id === sizeId);
    return size?.label || sizeId || '';
  }

  calcularSubtotal(): number {
    return this.pedido.items?.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0) || 0;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      entregado: 'Entregado',
      'en camino': 'En camino'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pendiente': return 'status-pendiente';
      case 'en camino': return 'status-en-camino';
      case 'entregado': return 'status-entregado';
      case 'cancelado': return 'status-cancelado';
      default: return 'status-pendiente';
    }
  }

  formatDate(ts: any): string {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '—';
    }
  }

  async cancelarPedido() {
    const alert = await this.alertCtrl.create({
      header: '¿Cancelar pedido?',
      message: '¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'No, mantener',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Sí, cancelar',
          cssClass: 'alert-danger',
          handler: async () => {
            try {
              const db = getFirestore();
              const pedidoRef = doc(db, 'pedidos', this.pedido.id);
              await updateDoc(pedidoRef, { status: 'cancelado' });

              await this.showToast('Pedido cancelado exitosamente');
              await this.modalCtrl.dismiss({ cancelled: true });
            } catch (err) {
              console.error('Error cancelando pedido:', err);
              await this.showToast('Error al cancelar el pedido');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
