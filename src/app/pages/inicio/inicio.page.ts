import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Product } from '../../models/product.model';

import { PromoService } from '../../services/promo.service';
import { ProductService } from '../../services/product.service';
import { StorageService } from '../../services/storage.service';

import { HeaderComponent } from '../../components/header/header/header.component';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { PromoSliderComponent } from '../../components/promo-slider/promo-slider.component';
import { CategorySlidersComponent } from '../../components/category-sliders/category-sliders.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HeaderComponent,
    FooterComponent,
    PromoSliderComponent,
    CategorySlidersComponent
  ],
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit, OnDestroy {
  promos: any[] = [];
  products: Product[] = [];

  // búsqueda
  searchTerm = '';
  filteredProducts: Product[] = [];

  loadingPromos = true;
  loadingProducts = true;

  // animación de resultados
  animateResults = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private promoSvc: PromoService,
    private productSvc: ProductService,
    private storageSvc: StorageService
  ) {}

  ngOnInit(): void {
    this.loadPromos();
    this.loadProducts();
  }

  private loadPromos(): void {
    this.loadingPromos = true;
    this.promoSvc.getPromos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => { 
          // Las promos ya vienen con imagenUrl del servicio
          this.promos = (list || []).map(p => ({
            ...p,
            nombre: (p as any).nombre ?? ''
          })) as any[];
          this.loadingPromos = false; 
        },
        error: () => { 
          this.promos = []; 
          this.loadingPromos = false; 
        }
      });
  }

  private async loadProducts(): Promise<void> {
    this.loadingProducts = true;
    this.productSvc.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (list) => {
          this.products = (list || []).map(p => ({
            ...p,
            id: (p as any).id ?? '',
            nombre: (p as any).nombre ?? (p as any).name ?? '',
            descripcion: (p as any).descripcion ?? (p as any).description ?? '',
            imagen: (p as any).imagen ?? (p as any).image ?? '',
            precio: (p as any).precio ?? (p as any).price ?? null,
            categoria: (p as any).categoria ?? (p as any).category ?? ''
          })) as Product[];

          // Cargar URLs de imágenes
          const imagePaths = this.products
            .map(p => (p as any).imagen)
            .filter((img): img is string => !!img);

          if (imagePaths.length > 0) {
            const urlMap = await this.storageSvc.getImageUrls(imagePaths);
            this.products.forEach(product => {
              const imagePath = (product as any).imagen;
              if (imagePath) {
                (product as any).imagenUrl = urlMap.get(imagePath);
              }
            });
          }

          this.filteredProducts = [...this.products];
          this.loadingProducts = false;
        },
        error: () => { this.products = []; this.filteredProducts = []; this.loadingProducts = false; }
      });
  }

  // search: filtra por nombre, descripción, categoría
  onSearchInput(ev: any) {
    const q = (ev?.detail?.value ?? '').toString().trim().toLowerCase();
    this.searchTerm = q;
    if (!q) {
      this.filteredProducts = [...this.products];
      this.animateResults = false;
      return;
    }

    this.filteredProducts = this.products.filter(p => {
      const name = ((p as any).nombre ?? '').toString().toLowerCase();
      const desc = ((p as any).descripcion ?? '').toString().toLowerCase();
      const cat = ((p as any).categoria ?? '').toString().toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });

    // activar animación (pequeño delay para que Angular pinte la lista)
    this.animateResults = false;
    setTimeout(() => this.animateResults = true, 30);
  }

  onSearchSelect(p: any) {
    const id = p?.id ?? p?._id ?? p?.idProducto ?? p?.['id'];
    if (id) {
      // navega pasando el id como query param
      void this.router.navigate(['/producto'], { queryParams: { id } });
    } else {
      // si el producto no tiene id, pasa el objeto por state como fallback
      void this.router.navigate(['/producto'], { state: { product: p } });
    }
  }

  onPromoSelect(p: any) {
    void this.router.navigate(['/productos'], { queryParams: { promoId: p.id } });
  }
  onPromoVerMas() { void this.router.navigate(['/promociones']); }

  onProductVerMas(category: string) {
    void this.router.navigate(['/productos'], { queryParams: { category } });
  }
  onProductSelect(p: Product) {
    void this.router.navigate(['/productos'], { queryParams: { id: (p as any).id } });
  }
  onProductToggleFavorite(ev: { product: Product }) {
    console.log('toggle favorite', ev.product?.id);
  }

  // trackBy para mejorar rendimiento y animación
  trackById(_i: number, item: any) {
    return item?.id ?? item?.nombre ?? _i;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}