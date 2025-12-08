import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonButton, IonModal, IonItem, IonInput, IonLabel, IonTextarea,
  IonCard, IonCardHeader, IonCardContent, IonList,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { IonMenuComponent } from '../../components/ion-menu/ion-menu.component'


import { PromoService, Promo } from '../../services/promo.service';
import { addIcons } from 'ionicons';
import { pencil, trash, add } from 'ionicons/icons';

@Component({
  selector: 'app-admin-promos',
  templateUrl: './admin-promos.page.html',
  styleUrls: ['./admin-promos.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    CommonModule, FormsModule,
    IonButton, IonModal, IonItem, IonInput, IonLabel, IonTextarea,
    IonCard, IonCardHeader, IonCardContent, IonList,
    IonIcon, IonSpinner, IonMenuComponent
  ]
})
export class AdminPromosPage implements OnInit {

  promos: Promo[] = [];
  loading = false;

  isModalOpen = false;
  isEditMode = false;

  formData: Promo = {
    id: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: ''
  };

  constructor(private promoService: PromoService) {
    addIcons({ pencil, trash, add, close: 'close', save: 'save', 'close-circle': 'close-circle' });
  }

  ngOnInit() {
    this.cargarPromos();
  }

  async cargarPromos() {
    this.loading = true;

    this.promoService.getPromos().subscribe({
      next: (data) => {
        this.promos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando promos', err);
        this.loading = false;
      }
    });
  }

  abrirModalNuevo() {
    this.isEditMode = false;

    this.formData = {
      id: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      imagen: ''
    };

    this.isModalOpen = true;
  }

  abrirModalEditar(promo: Promo) {
    this.isEditMode = true;

    this.formData = { ...promo };

    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  async guardar() {
    try {
      if (this.isEditMode && this.formData.id) {
        // EDITAR PROMO
        const firestore = (await import('firebase/firestore'));
        const db = firestore.getFirestore();
        const ref = firestore.doc(db, 'promociones', this.formData.id);

        await firestore.updateDoc(ref, {
          nombre: this.formData.nombre,
          descripcion: this.formData.descripcion,
          precio: this.formData.precio,
          imagen: this.formData.imagen
        });

      } else {
        // 🔥 CREAR PROMO
        const firestore = (await import('firebase/firestore'));
        const db = firestore.getFirestore();

        await firestore.addDoc(
          firestore.collection(db, 'promociones'),
          {
            nombre: this.formData.nombre,
            descripcion: this.formData.descripcion,
            precio: this.formData.precio,
            imagen: this.formData.imagen
          }
        );
      }

      this.isModalOpen = false;
      this.cargarPromos();

    } catch (error) {
      console.error('Error guardando promo:', error);
    }
  }

  async eliminar(id?: string) {
    if (!id) return;

    if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      try {
        const firestore = (await import('firebase/firestore'));
        const db = firestore.getFirestore();
        await firestore.deleteDoc(firestore.doc(db, 'promociones', id));
        this.cargarPromos();
      } catch (error) {
        console.error('Error eliminando promoción:', error);
      }
    }
  }
}

