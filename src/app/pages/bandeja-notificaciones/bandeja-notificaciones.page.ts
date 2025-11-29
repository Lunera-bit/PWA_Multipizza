import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonButtons, IonButton, IonBadge } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { NotificationComponent } from '../../components/notification/notification.component';

@Component({
  selector: 'app-bandeja-notificaciones',
  templateUrl: './bandeja-notificaciones.page.html',
  styleUrls: ['./bandeja-notificaciones.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonButtons, IonButton, IonBadge, NotificationComponent]
})
export class BandejaNotificacionesPage implements OnInit, OnDestroy {
  notificaciones: any[] = [];
  private unsub?: () => void;
  private authUnsub?: () => void;

  constructor(private router: Router) {}

  ngOnInit() {
    const auth = getAuth();
    this.authUnsub = onAuthStateChanged(auth, user => {
      if (!user) {
        this.notificaciones = [];
        if (this.unsub) { this.unsub(); this.unsub = undefined; }
        return;
      }
      const db = getFirestore();
      const q = query(collection(db, 'notificaciones'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      if (this.unsub) this.unsub();
      this.unsub = onSnapshot(q, snap => {
        this.notificaciones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      });
    }) as unknown as () => void;
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
    if (this.authUnsub) this.authUnsub();
  }

  // botón para volver a la página inicio
  openInicio() {
    void this.router.navigate(['/inicio']);
  }

  // helper para el contador (muestra sólo las no leídas)
  unreadCount() {
    return this.notificaciones.filter(n => !n.read).length;
  }
}