import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonMenuComponent } from '../../components/ion-menu/ion-menu.component'


@Component({
  selector: 'app-admin-productos',
  templateUrl: './admin-productos.page.html',
  styleUrls: ['./admin-productos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuComponent]
})
export class AdminProductosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
