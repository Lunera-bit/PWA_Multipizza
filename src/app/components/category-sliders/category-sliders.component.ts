import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';

// Swiper global desde CDN en index.html
declare const Swiper: any;

@Component({
  selector: 'app-category-sliders',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FavoriteButtonComponent],
  templateUrl: './category-sliders.component.html',
  styleUrls: ['./category-sliders.component.scss']
})
export class CategorySlidersComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() categories: string[] = ['pizzas', 'bebidas', 'otros'];
  @Input() products: any[] | null = null; // si se pasa, se usa; si no, se carga desde ProductService
  @Input() loading = false;

  @Output() verMas = new EventEmitter<string>();
  @Output() select = new EventEmitter<any>();
  @Output() toggleFavorite = new EventEmitter<any>();

  @ViewChildren('swiperEl', { read: ElementRef }) swiperEls!: QueryList<ElementRef>;
  private swipers: any[] = [];
  private sub: Subscription | null = null;

  constructor(private router: Router, private productSvc: ProductService) {}

  ngOnInit(): void {
    if (!this.products) {
      this.loading = true;
      this.sub = this.productSvc.getProducts()?.subscribe({
        next: (list: any[]) => {
          this.products = (list || []).map(p => ({
            ...p,
            id: p.id ?? p._id ?? p.idProducto ?? p['id'] ?? '',
            nombre: p.nombre ?? p.name ?? '',
            descripcion: p.descripcion ?? p.description ?? '',
            imagen: p.imagen ?? p.image ?? '',
            precio: p.precio ?? p.price ?? 0,
            categoria: p.categoria ?? p.category ?? 'otros'
          }));
          this.loading = false;
          // reinit swipers después de datos
          setTimeout(() => this.initSwipers(), 50);
        },
        error: () => { this.products = []; this.loading = false; }
      });
    } else {
      // si products fue pasado, inicializar swipers tras render
      setTimeout(() => this.initSwipers(), 50);
    }
  }

  ngAfterViewInit(): void {
    // init también aquí para el caso en que products ya existan
    setTimeout(() => this.initSwipers(), 100);
  }

  productsBy(cat: string) {
    if (!this.products) return [];
    const c = (cat || '').toString().toLowerCase();
    return this.products.filter(p => ((p?.categoria ?? p?.category ?? '') + '').toString().toLowerCase() === c);
  }

  getId(p: any) {
    return (p?.id ?? p?._id ?? p?.idProducto ?? p?.['id'] ?? '') as string;
  }

  openProduct(p: any) {
    const id = this.getId(p);
    if (!id) return;
    this.select.emit(p);
    void this.router.navigate(['/producto'], { queryParams: { id } });
  }

  onVerMas(cat: string) { this.verMas.emit(cat); }

  onToggleFav(p: any, ev?: boolean | Event) {
    // ev puede ser boolean (toggle) o Event; no queremos que propague click del botón favorito
    if (ev && typeof ev === 'object' && 'stopPropagation' in ev) {
      try { (ev as Event).stopPropagation(); } catch {}
    }
    this.toggleFavorite.emit(p);
  }

  private initSwipers(): void {
    // destruir instancias previas
    this.swipers.forEach(s => s && s.destroy && s.destroy(true));
    this.swipers = [];

    if (typeof Swiper === 'undefined') return; // fallback a scroll horizontal si no existe CDN

    // inicializar Swiper en cada contenedor
    try {
      this.swiperEls.forEach(elRef => {
        const el = elRef.nativeElement as HTMLElement;
        // Sólo inicializar si aún no está inicializado (evitar doble)
        if (!el.classList.contains('swiper-initialized')) {
          const s = new Swiper(el, {
            slidesPerView: 'auto',
            spaceBetween: 12,
            loop: true,
            freeMode: true,
            grabCursor: true,
            autoplay: false,
            watchOverflow: true
          });
          this.swipers.push(s);
        }
      });
    } catch { /* ignore */ }
  }

  onImgError(ev: Event) {
    const img = ev?.target as HTMLImageElement | null;
    if (img) img.src = 'assets/img/placeholder.png';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.swipers.forEach(s => s && s.destroy && s.destroy(true));
    this.swipers = [];
  }

  trackByIdx(_i: number, item: any) { return item?.id ?? item?._id ?? _i; }
}