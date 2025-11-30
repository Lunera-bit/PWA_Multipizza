import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductService } from '../../services/product.service';
import { StorageService } from '../../services/storage.service';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { AddToCartComponent } from '../../components/add-to-cart/add-to-cart.component';
import { FavoriteButtonComponent } from '../../components/favorite-button/favorite-button.component';

interface Size {
  id: string;
  label: string;
  multiplier: number;
}

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FooterComponent,
    AddToCartComponent,
    FavoriteButtonComponent],
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss']
})
export class ProductoPage implements OnInit, OnDestroy {
  product: any = null;
  loading = true;
  isFavorited = false;
  selectedSize: string = 'personal';

  sizes: Size[] = [
    { id: 'personal', label: 'Personal - S', multiplier: 1 },
    { id: 'mediana', label: 'Mediana - M', multiplier: 1.4 },
    { id: 'grande', label: 'Grande - L', multiplier: 1.6 },
    { id: 'familiar', label: 'Familiar - XL', multiplier: 1.8 }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: ProductService,
    private storageSvc: StorageService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id') ?? '';
      if (!id) {
        this.loading = false;
        return;
      }
      this.loadProductById(id);
    });
  }

  private normalize(p: any) {
    if (!p) return p;
    return {
      ...p,
      id: p.id ?? p._id ?? p.idProducto ?? p['id'] ?? '',
      nombre: p.nombre ?? p.name ?? p.titulo ?? '',
      descripcion: p.descripcion ?? p.description ?? '',
      imagen: p.imagen ?? p.image ?? '',
      precio: p.precio ?? p.price ?? null,
      categoria: p.categoria ?? p.category ?? ''
    };
  }

  private async loadProductById(id: string) {
    this.loading = true;
    this.productSvc.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: async (list: any[]) => {
        const found = (list || []).find(p =>
          (p.id ?? p._id ?? p.idProducto ?? p['id'] ?? '').toString() === id.toString()
        );
        this.product = this.normalize(found ?? null);

        // Cargar la URL de la imagen desde Firebase Storage
        if (this.product && this.product.imagen) {
          try {
            this.product.imagenUrl = await this.storageSvc.getImageUrl(this.product.imagen);
          } catch (error) {
            console.error('Error cargando imagen:', error);
            this.product.imagenUrl = '';
          }
        }

        this.isFavorited = !!(this.product && this.product.favorited);
        this.selectedSize = 'personal';
        this.loading = false;
      },
      error: () => {
        this.product = null;
        this.loading = false;
      }
    });
  }

  selectSize(sizeId: string) {
    this.selectedSize = sizeId;
  }

  getPriceMultiplier(sizeId: string): number {
    const size = this.sizes.find(s => s.id === sizeId);
    return size?.multiplier ?? 1;
  }

  getCalculatedPrice(): number {
    if (!this.product || !this.product.precio) return 0;
    const multiplier = this.getPriceMultiplier(this.selectedSize);
    const price = this.product.precio * multiplier;
    
    // Redondear al 0.10 más cercano
    return Math.round(price * 10) / 10;
  }

  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
    console.log('favorite toggle', this.product?.id, this.isFavorited);
  }

  shareProduct(p: any) {
    try {
      if ((navigator as any).share) {
        (navigator as any).share({
          title: p.nombre,
          text: p.descripcion ?? '',
          url: location.href
        });
      } else {
        navigator.clipboard?.writeText(location.href);
      }
    } catch { /* ignore */ }
  }

  goHome() {
    void this.router.navigate(['/inicio']);
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/icon/placeholder.png';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}