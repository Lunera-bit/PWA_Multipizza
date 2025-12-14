/**
 * INTEGRACIÓN CON MENÚ
 * 
 * Código para agregar opciones de menú según el rol del usuario.
 * Este código debe ser integrado en tu app.component.ts y app.component.html
 */

// ============================================
// app.component.ts (agregar estas líneas)
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export class AppComponent implements OnInit, OnDestroy {
  userRole: string | null = null;
  displayName: string | null = null;
  private unsubscribe?: () => void;

  constructor() {}

  ngOnInit() {
    const auth = getAuth();
    this.unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.displayName = user.displayName || 'Usuario';
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            this.userRole = userDoc.data()['rol'] || 'cliente';
          } else {
            this.userRole = 'cliente';
          }
        } catch (error) {
          console.error('Error getting user role:', error);
          this.userRole = 'cliente';
        }
      } else {
        this.userRole = null;
        this.displayName = null;
      }
    }) as unknown as () => void;
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  isDelivery(): boolean {
    return this.userRole === 'delivery';
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isClient(): boolean {
    return this.userRole === 'cliente';
  }
}

// ============================================
// app.component.html (agregar en el menú)
// ============================================

/*
<ion-menu contentId="main-content" side="start">
  <ion-header>
    <ion-toolbar>
      <ion-title>Multipizza</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <!-- Usuario Info -->
    <ion-item *ngIf="displayName" class="user-info">
      <ion-label>
        <h2>{{ displayName }}</h2>
        <p>{{ userRole === 'delivery' ? 'Repartidor' : userRole === 'admin' ? 'Administrador' : 'Cliente' }}</p>
      </ion-label>
    </ion-item>

    <ion-list>
      <!-- Para Clientes -->
      <ng-container *ngIf="isClient() || isAdmin()">
        <ion-item [routerLink]="['/inicio']" routerLinkActive="active">
          <ion-icon slot="start" name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/productos']" routerLinkActive="active">
          <ion-icon slot="start" name="restaurant-outline"></ion-icon>
          <ion-label>Productos</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/carrito']" routerLinkActive="active">
          <ion-icon slot="start" name="cart-outline"></ion-icon>
          <ion-label>Carrito</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/pedidos']" routerLinkActive="active">
          <ion-icon slot="start" name="list-outline"></ion-icon>
          <ion-label>Mis Pedidos</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/favoritos']" routerLinkActive="active">
          <ion-icon slot="start" name="heart-outline"></ion-icon>
          <ion-label>Favoritos</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/promociones']" routerLinkActive="active">
          <ion-icon slot="start" name="pricetag-outline"></ion-icon>
          <ion-label>Promociones</ion-label>
        </ion-item>
      </ng-container>

      <!-- Para Delivery -->
      <ng-container *ngIf="isDelivery()">
        <ion-item [routerLink]="['/delivery-pedidos']" routerLinkActive="active">
          <ion-icon slot="start" name="car-outline"></ion-icon>
          <ion-label>Mis Pedidos</ion-label>
          <ion-badge color="primary">5</ion-badge>
        </ion-item>

        <ion-item [routerLink]="['/bandeja-notificaciones']" routerLinkActive="active">
          <ion-icon slot="start" name="notifications-outline"></ion-icon>
          <ion-label>Notificaciones</ion-label>
        </ion-item>
      </ng-container>

      <!-- Para Admin -->
      <ng-container *ngIf="isAdmin()">
        <ion-item-divider>
          <ion-label>Administración</ion-label>
        </ion-item-divider>

        <ion-item [routerLink]="['/admin-productos']" routerLinkActive="active">
          <ion-icon slot="start" name="add-circle-outline"></ion-icon>
          <ion-label>Productos</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/admin-promos']" routerLinkActive="active">
          <ion-icon slot="start" name="gift-outline"></ion-icon>
          <ion-label>Promociones</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/admin-pedidos']" routerLinkActive="active">
          <ion-icon slot="start" name="clipboard-outline"></ion-icon>
          <ion-label>Pedidos</ion-label>
        </ion-item>

        <ion-item [routerLink]="['/admin-usuarios']" routerLinkActive="active">
          <ion-icon slot="start" name="people-outline"></ion-icon>
          <ion-label>Usuarios</ion-label>
        </ion-item>
      </ng-container>

      <!-- Común -->
      <ion-item-divider></ion-item-divider>

      <ion-item [routerLink]="['/bandeja-notificaciones']" routerLinkActive="active">
        <ion-icon slot="start" name="mail-outline"></ion-icon>
        <ion-label>Notificaciones</ion-label>
      </ion-item>

      <ion-item [routerLink]="['/chat']" routerLinkActive="active">
        <ion-icon slot="start" name="chatbubble-outline"></ion-icon>
        <ion-label>Chat</ion-label>
      </ion-item>

      <ion-item button (click)="logout()">
        <ion-icon slot="start" name="log-out-outline"></ion-icon>
        <ion-label>Cerrar Sesión</ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</ion-menu>

<style scoped>
  .user-info {
    padding: 16px;
    border-bottom: 1px solid #eee;
  }

  .user-info h2 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .user-info p {
    margin: 0;
    font-size: 12px;
    color: #999;
  }

  ion-item.active {
    --color: #007bff;
    --background: #f8f9fa;
  }

  ion-badge {
    margin-left: 8px;
  }
</style>
*/
