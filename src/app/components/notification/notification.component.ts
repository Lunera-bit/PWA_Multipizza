import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
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
      void this.router.navigate(['/pedidos'], { queryParams: pedidoId ? { pedidoId } : {} });
    } else {
      return;
    }
  }
}