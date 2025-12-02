import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss']
})
export class ProductosPage implements OnInit, OnDestroy {
  productos: any[] = [];
  filtered: any[] = [];
  sortBy: 'price_desc' | 'price_asc' | 'name_asc' | 'name_desc' = 'price_desc';
  loading = true;

  selectedTags = new Set<string>();
  selectedTagSingle: string | null = null;

  maxPrice = 0;
  priceFilter = { min: 0, max: 0 };

  category: string | null = null;
  isPizzaCategory = false;
  availableTags: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private productSvc: ProductService,
    private storageSvc: StorageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Limpiar caché expirado al cargar la página
    this.storageSvc.clearExpiredCache();

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(q => {
      this.category = q.get('category');
      this.isPizzaCategory = !!this.category && ['pizza', 'pizzas'].includes(this.category.toLowerCase());
      this.applyFilters();
    });

    this.loading = true;
    this.productSvc.getProducts()?.pipe(takeUntil(this.destroy$)).subscribe({
      next: async (list) => {
        this.productos = (list || []).map(p => ({
          ...p,
          precio: p.precio ?? (p as any).price ?? 0,
          tags: p.tags ?? []
        }));

        // Cargar URLs de imágenes (ahora cachea automáticamente)
        const imagePaths = this.productos
          .map(p => p.imagen || (p as any).image)
          .filter((img): img is string => !!img);

        if (imagePaths.length > 0) {
          // getImageUrls ya cachea en LocalStorage automáticamente
          const urlMap = await this.storageSvc.getImageUrls(imagePaths);
          this.productos.forEach(p => {
            const imagePath = p.imagen || (p as any).image;
            if (imagePath) {
              p.imagenUrl = urlMap.get(imagePath);
            }
          });
        }

        // tags disponibles
        const tagsSet = new Set<string>();
        this.productos.forEach(p => {
          if ((p.categoria ?? p.category ?? '').toString().toLowerCase() === 'pizza' || 
              (p.categoria ?? p.category ?? '').toString().toLowerCase() === 'pizzas') {
            (p.tags || []).forEach((t: string) => tagsSet.add(String(t)));
          }
        });
        this.availableTags = Array.from(tagsSet).sort();

        const prices = this.productos.map(p => Number(p.precio) || 0);
        const computedMax = Math.max(0, ...(prices.length ? prices : [0]));
        const SLIDER_CAP = 100;
        this.priceFilter = { min: 0, max: SLIDER_CAP };
        this.maxPrice = Math.min(computedMax, SLIDER_CAP);
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleTag(tag: string) {
    if (this.selectedTags.has(tag)) this.selectedTags.delete(tag);
    else this.selectedTags.add(tag);
    this.selectedTagSingle = null;
    this.applyFilters();
  }

  onSelectSingleTag(tag: string | null) {
    this.selectedTagSingle = tag;
    this.selectedTags.clear();
    if (tag) this.selectedTags.add(tag);
    this.applyFilters();
  }

  onPriceChange(v: any) {
    let val = 0;
    if (typeof v === 'number') val = v;
    else if (v && typeof v === 'object') {
      if ('detail' in v && v.detail && 'value' in v.detail) val = Number(v.detail.value);
      else if ('value' in v) val = Number(v.value);
      else if (v.target && 'value' in v.target) val = Number(v.target.value);
    }
    this.maxPrice = isNaN(val) ? 0 : val;
    this.applyFilters();
  }

  onSortChange(value: string) {
    this.sortBy = (value as any) || 'price_desc';
    this.applyFilters();
  }

  applyFilters() {
    const tags = Array.from(this.selectedTags).map(t => t.toLowerCase());
    this.filtered = this.productos.filter(p => {
      if (this.category && (p.categoria ?? p.category ?? '').toString().toLowerCase() !== this.category?.toLowerCase()) {
        return false;
      }
      if (typeof this.maxPrice === 'number' && this.maxPrice > 0 && (p.precio ?? 0) > this.maxPrice) return false;
      if (this.isPizzaCategory && tags.length) {
        const pTags: string[] = (p.tags || []).map((t:any)=>t.toString().toLowerCase());
        if (!tags.some(t => pTags.includes(t))) return false;
      }
      return true;
    });

    switch (this.sortBy) {
      case 'price_asc':
        this.filtered.sort((a,b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
        break;
      case 'price_desc':
        this.filtered.sort((a,b) => (Number(b.precio) || 0) - (Number(a.precio) || 0));
        break;
      case 'name_asc':
        this.filtered.sort((a,b) => String(a.nombre ?? a.name ?? '').localeCompare(String(b.nombre ?? b.name ?? ''), 'es', { sensitivity: 'base' }));
        break;
      case 'name_desc':
        this.filtered.sort((a,b) => String(b.nombre ?? b.name ?? '').localeCompare(String(a.nombre ?? a.name ?? ''), 'es', { sensitivity: 'base' }));
        break;
    }
  }

  openProduct(p: any) {
    const id = p?.id ?? p?._id ?? p?.idProducto ?? p?.['id'];
    if (!id) return;
    void this.router.navigate(['/producto'], { queryParams: { id } });
  }

  trackById(_: number, it: any) { return it?.id ?? it?._id ?? _; }

  onImgError(ev: Event) {
    const img = ev?.target as HTMLImageElement | null;
    if (img) img.src = 'assets/img/placeholder.png';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}