import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonText, AlertController, ModalController } from '@ionic/angular/standalone';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-detallepedido',
  templateUrl: './detallepedido.component.html',
  styleUrls: ['./detallepedido.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonText]
})
export class DetallepedidoComponent {
  @Input() pedido: any;

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {}

  async cancelarPedido() {
    const alert = await this.alertCtrl.create({
      header: '¿Confirmar cancelación?',
      message: '¿Estás seguro de que quieres cancelar este pedido?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: async () => {
            try {
              const db = getFirestore();
              const pedidoRef = doc(db, 'pedidos', this.pedido.id);
              await updateDoc(pedidoRef, { status: 'cancelado' });

              await this.mostrarToast('Pedido cancelado');
              await this.modalCtrl.dismiss();
            } catch (err) {
              console.error('Error cancelando pedido:', err);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarToast(message: string) {
    // Usar ToastController si lo necesitas
    alert(message);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
