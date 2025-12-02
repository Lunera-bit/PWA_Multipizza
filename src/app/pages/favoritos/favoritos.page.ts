import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, IonAvatar, IonImg, IonButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FavoriteService } from '../../services/favorite.service';
import { ProductService } from '../../services/product.service';
import { StorageService } from '../../services/storage.service';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaz para el producto con imagenUrl
interface Product {
  id?: string;
  nombre?: string;
  descripcion?: string;
  imagen?: string;
  imagenUrl?: string;
  precio?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel, IonAvatar, IonImg, IonButton,
    FooterComponent
  ],
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss']
})
export class FavoritosPage implements OnInit, OnDestroy {
  products: Product[] = [];
  private favUnsub?: () => void;
  private destroy$ = new Subject<void>();

  constructor(
    private favService: FavoriteService,
    private productService: ProductService,
    private storageSvc: StorageService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Limpiar caché expirado al cargar la página
    this.storageSvc.clearExpiredCache();

    // Suscribirse a favoritos del usuario
    this.favUnsub = this.favService.observeFavorites(async (ids) => {
      try {
        console.log('[FavoritosPage] favorite ids:', ids);
        await this.loadProductsByIds(ids || []);
      } catch (e) {
        console.error('[FavoritosPage] error loading favorites', e);
        this.products = [];
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    try { this.favUnsub?.(); } catch (e) { /* ignore */ }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProductsByIds(ids: string[]) {
    const loaded: Product[] = [];

    if (!ids || ids.length === 0) {
      this.products = [];
      this.cd.detectChanges();
      return;
    }

    // Para cada id favorita, obtener el producto usando ProductService
    for (const id of ids) {
      try {
        this.productService.getProductById(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async (product: any) => {
              if (product) {
                // agregar a lista si no existe
                if (!loaded.find(p => p.id === id)) {
                  const prodWithUrl: Product = { ...product, id };

                  // Cargar URL de la imagen desde Storage (ahora cachea automáticamente)
                  const imagePath = product.imagen || product.image;
                  if (imagePath) {
                    try {
                      prodWithUrl.imagenUrl = await this.storageSvc.getImageUrl(imagePath);
                    } catch (error) {
                      console.error('[FavoritosPage] error cargando imagen:', error);
                      prodWithUrl.imagenUrl = '';
                    }
                  }

                  loaded.push(prodWithUrl);
                  this.products = [...loaded]; // actualizar array reactivamente
                  this.cd.detectChanges();
                }
              } else {
                console.warn('[FavoritosPage] producto no encontrado', id);
              }
            },
            error: (err) => {
              console.error('[FavoritosPage] error cargando producto', id, err);
            }
          });
      } catch (e) {
        console.error('[FavoritosPage] error en loadProductsByIds', id, e);
      }
    }
  }

  openProduct(id: string | undefined) {
    if (!id) {
      void this.router.navigate(['/inicio']);
      return;
    }
    void this.router.navigate(['/producto'], { queryParams: { id } });
  }

  formatPrice(precio: number | undefined): string {
    if (!precio) return '';
    return `S/. ${precio.toFixed(2)}`;
  }
}