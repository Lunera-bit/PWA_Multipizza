import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton, AlertController, ModalController } from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Router } from '@angular/router';
import { DetallepedidoComponent } from '../../components/detallepedido/detallepedido.component';

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
export class PedidosPage implements OnInit {
  pedidos: Pedido[] = [];

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  async cargarPedidos() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const db = getFirestore();
      const q = query(collection(db, 'pedidos'), where('user.uid', '==', user.uid));
      const querySnapshot = await getDocs(q);

      this.pedidos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pedido[];

      // ordenar por fecha descendente (más recientes primero)
      this.pedidos.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    }
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
