import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 👉 IMPORTS DE IONIC NECESARIOS PARA TU HTML
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonList,
  IonIcon,
  IonToggle,
  IonAccordion,
  IonAccordionGroup,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-ion-menu',
  templateUrl: './ion-menu.component.html',
  styleUrls: ['./ion-menu.component.scss'],
  standalone: true,
  imports: [
    // Ionic components usados en tu HTML
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonList,
    IonIcon,
    IonToggle,
    IonAccordion,
    IonAccordionGroup,
    CommonModule,
    RouterModule,
  ],
})
export class IonMenuComponent implements OnInit {
  isLoggedIn: boolean = false;
  displayName: string = '';
  displayEmail?: string;
  defaultAvatar = 'assets/img/avatar-default.svg';
  rol: string = '';
  photo = this.defaultAvatar;

  private sub?: Subscription;


  constructor(
    private authService: AuthService,
    private menuCtrl: MenuController,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.sub = this.authService.authState$.subscribe(async (u) => {
      this.isLoggedIn = !!u;
      this.displayName = u?.displayName || 'Usuario';
      this.displayEmail = u?.email || '';
      this.photo = (u as any)?.photoURL || this.defaultAvatar;
    });
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  loadUserData() {
    const user = this.authService.currentUser();
    if (user) this.updateUser(user);
  }

  updateUser(user: any) {
    this.isLoggedIn = true;
    this.displayName = user.displayName ?? 'Sin nombre';
    this.displayEmail = user.email ?? '';
    this.photo = user.photoURL ?? '../../assets/img/avatar-default.svg';
    this.rol = user.rol ?? '';
  }

  clearUser() {
    this.isLoggedIn = false;
    this.displayName = '';
    this.displayEmail = '';
    this.photo = '../../assets/img/avatar-default.svg';
    this.rol = '';
  }

  onImgError() {
    this.photo = '../../assets/img/avatar-default.svg';
  }

  editName() {
    console.log('Editar nombre…');
  }

  closeMenu() {
    this.menuCtrl.close('profileMenu');
  }
}
