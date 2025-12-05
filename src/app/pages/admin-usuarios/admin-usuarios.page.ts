import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonModal, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonIcon, IonSpinner, IonAccordionGroup, IonAccordion, IonCard, IonCardHeader, IonCardContent } from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { AppUser } from '../../models/user.model';
import { addIcons } from 'ionicons';
import { pencil, trash, add } from 'ionicons/icons';
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.page.html',
  styleUrls: ['./admin-usuarios.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonModal, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonIcon, IonSpinner, IonAccordionGroup, IonAccordion, IonCard, IonCardHeader, IonCardContent]
})
export class DashboardPage implements OnInit {
  usuarios: AppUser[] = [];
  loading = false;
  isModalOpen = false;
  isEditMode = false;
  
  formData = {
    uid: '',
    email: '',
    displayName: '',
    rol: 'cliente' as 'cliente' | 'admin',
    provider: 'email'
  };

  constructor(private userService: UserService) {
    addIcons({ pencil, trash, add });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.loading = true;
    try {
      this.usuarios = await this.userService.getAllUsers();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      this.loading = false;
    }
  }

  abrirModalNuevo() {
    this.isEditMode = false;
    this.formData = {
      uid: '',
      email: '',
      displayName: '',
      rol: 'cliente',
      provider: 'email'
    };
    this.isModalOpen = true;
  }

  abrirModalEditar(usuario: AppUser) {
    this.isEditMode = true;
    this.formData = {
      uid: usuario.uid,
      email: usuario.email || '',
      displayName: usuario.displayName || '',
      rol: usuario.rol || 'cliente',
      provider: usuario.provider || 'email'
    };
    this.isModalOpen = true;
  }

  async guardar() {
    try {
      if (this.isEditMode) {
        await this.userService.updateUser(this.formData.uid, this.formData);
      } else {
        await this.userService.createUser(this.formData);
      }
      this.isModalOpen = false;
      await this.cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  }

  async eliminar(uid: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await this.userService.deleteUser(uid);
        await this.cargarUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  }

  cerrarModal() {
    this.isModalOpen = false;
  }
}
