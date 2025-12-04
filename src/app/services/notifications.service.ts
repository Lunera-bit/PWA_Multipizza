import { Injectable } from '@angular/core';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private unsubscribePedidos?: () => void;
  private lastStatuses = new Map<string, string>();

  startListeningPedidos(userId: string) {
    try {
      this.stopListeningPedidos();
      const db = getFirestore();
      const q = query(collection(db, 'pedidos'), where('user.uid', '==', userId));

      console.log('[NotificationsService] startListeningPedidos for', userId);

      this.unsubscribePedidos = onSnapshot(q, snapshot => {
        // Si aún no hemos inicializado, cargamos el estado actual de todos los pedidos
        if (this.lastStatuses.size === 0) {
          snapshot.docs.forEach(d => {
            const s = (d.data() as any).status;
            this.lastStatuses.set(d.id, s);
          });
          console.log('[NotificationsService] initial statuses set', Array.from(this.lastStatuses.entries()));
          return;
        }

        snapshot.docChanges().forEach(change => {
          const id = change.doc.id;
          const data = change.doc.data() as any;
          const status = data?.status as string | undefined;
          const prev = this.lastStatuses.get(id);

          if (change.type === 'modified') {
            if (prev !== status) {
              console.log(`[NotificationsService] status changed for ${id}: ${prev} -> ${status}`);
              this.lastStatuses.set(id, status ?? '');
              const label = this.getStatusLabel(status ?? '');
              const message = `Su pedido con el numero #${id}, está ${label}`;
              // crear notificación (no bloquear)
              this.createNotification(userId, message, { pedidoId: id, status });
            } else {
              // mismo estado, ignorar
            }
          } else if (change.type === 'added') {
            // nueva orden: registrar estado
            this.lastStatuses.set(id, status ?? '');
          } else if (change.type === 'removed') {
            this.lastStatuses.delete(id);
          }
        });
      }, err => {
        console.error('[NotificationsService] onSnapshot error', err);
      });
    } catch (e) {
      console.error('[NotificationsService] startListeningPedidos error', e);
    }
  }

  stopListeningPedidos() {
    if (this.unsubscribePedidos) {
      try { this.unsubscribePedidos(); } catch { /* ignore */ }
      this.unsubscribePedidos = undefined;
    }
    this.lastStatuses.clear();
    console.log('[NotificationsService] stopListeningPedidos');
  }

  async createNotification(userId: string, message: string, meta?: any) {
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'notificaciones'), {
        userId,
        message,
        meta: meta || null,
        read: false,
        type: meta?.type || 'order',
        createdAt: serverTimestamp()
      });
      console.log('[NotificationsService] created notification:', message);
    } catch (e) {
      console.error('[NotificationsService] createNotification error', e);
    }
  }

  async ensureWelcomeIfNeeded(userId: string, displayName?: string) {
    try {
      const db = getFirestore();
      const q = query(collection(db, 'notificaciones'), where('userId', '==', userId), where('type', '==', 'welcome'));
      const snap = await getDocs(q);
      if (snap.empty) {
        const name = displayName || 'usuario';
        await addDoc(collection(db, 'notificaciones'), {
          userId,
          message: `Bienvenido a Multipizzas ${name}! Estamos felices por verte, gracias por crear tu cuenta.`,
          read: false,
          type: 'welcome',
          createdAt: serverTimestamp()
        });
        console.log('[NotificationsService] welcome notification created for', userId);
      }
    } catch (e) {
      console.error('[NotificationsService] ensureWelcomeIfNeeded error', e);
    }
  }

  // observa el número de notificaciones no leídas para un usuario
  observeUnreadCount(userId: string, cb: (count: number) => void): () => void {
    const db = getFirestore();
    const q = query(collection(db, 'notificaciones'), where('userId', '==', userId), where('read', '==', false));
    const unsub = onSnapshot(q, snap => {
      cb(snap.size);
    }, err => {
      console.error('notifications.observeUnreadCount error', err);
      cb(0);
    });
    return unsub;
  }

  private getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      entregado: 'Entregado',
      'en camino': 'En camino'
    };
    return labels[status] || status || '';
  }
}