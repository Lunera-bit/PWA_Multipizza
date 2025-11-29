import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonNote, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonNote, IonButton],
  template: `
    <ion-item button [class.unread]="!notification.read" (click)="open()">
      <ion-label>
        <h3 class="msg">{{ notification.message }}</h3>
        <p class="meta">{{ formatDate(notification.createdAt) }}</p>
      </ion-label>

      <ion-note slot="end" *ngIf="!notification.read" color="primary" class="new-badge">Nuevo</ion-note>
    </ion-item>
  `,
  styles: [`
    ion-item { --min-height: 64px; padding-right: 14px; }
    .unread { background: rgba(0, 123, 255, 0.04); border-left: 4px solid var(--ion-color-primary); }
    .msg { margin: 0; font-weight: 600; }
    .meta { margin: 4px 0 0; color: var(--ion-color-medium); font-size: 0.85rem; }
    .new-badge { font-weight: 700; padding: 4px 6px; border-radius: 6px; }
  `]
})
export class NotificationComponent {
  @Input() notification: any;

  constructor(private router: Router) {}

  formatDate(ts: any) {
    try {
      const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
      return d.toLocaleString();
    } catch {
      return '';
    }
  }

  async open() {
    try {
      // marcar como leída
      if (!this.notification.read) {
        const db = getFirestore();
        const ref = doc(db, 'notificaciones', this.notification.id);
        await updateDoc(ref, { read: true });
      }
    } catch (e) {
      console.error('Error marcando notificación', e);
    }

    // navegar sólo para notificaciones de pedido
    const t = this.notification.type || (this.notification.meta?.type) || 'order';
    if (t === 'order') {
      const pedidoId = this.notification.meta?.pedidoId;
      // si hay pedidoId, lo incluimos como queryParam para que PedidosPage lo pueda usar al abrir detalle
      void this.router.navigate(['/pedidos'], { queryParams: pedidoId ? { pedidoId } : {} });
    } else {
      // welcome u otros tipos: no navega a pedidos. Podrías navegar a perfil si quieres:
      // void this.router.navigate(['/perfil']);
      return;
    }
  }
}