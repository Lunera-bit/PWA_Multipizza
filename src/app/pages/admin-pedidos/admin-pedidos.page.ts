import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonMenuComponent } from '../../components/ion-menu/ion-menu.component'


@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './admin-pedidos.page.html',
  styleUrls: ['./admin-pedidos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuComponent]
})
export class AdminPedidosPage implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('AdminPedidosPage initialized');
  }

}
