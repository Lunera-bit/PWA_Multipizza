import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

// Swiper global desde CDN en index.html
declare const Swiper: any;

@Component({
  selector: 'app-promo-slider',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './promo-slider.component.html',
  styleUrls: ['./promo-slider.component.scss'],
})
export class PromoSliderComponent implements AfterViewInit, OnDestroy {
  @Input() promos: any[] = [];
  @Input() loading = false;
  @Input() title = 'Promociones';

  @Output() verMas = new EventEmitter<void>();
  @Output() select = new EventEmitter<any>();
  @Output() toggleFavorite = new EventEmitter<any>();

  @ViewChild('swiperEl', { static: false }) swiperEl!: ElementRef<HTMLElement>;
  private swiperInstance: any = null;

  constructor(private router: Router) {}

  onVerMas() { this.verMas.emit(); }

  onSelectPromo(p: any) {
    this.select.emit(p);
    const id = p?.id ?? p?._id ?? p?.idProducto ?? p?.['id'];
    if (id) void this.router.navigate(['/producto'], { queryParams: { id } });
  }

  onToggleFav(p: any, ev?: any) {
    if (ev && typeof ev === 'object' && 'stopPropagation' in ev) {
      try { (ev as Event).stopPropagation(); } catch {}
    }
    this.toggleFavorite.emit(p);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initSwiper(), 60);
  }

  private initSwiper(): void {
    try {
      if (this.swiperInstance && this.swiperInstance.destroy) {
        this.swiperInstance.destroy(true);
      }
      if (typeof Swiper === 'undefined') return;
      const el = this.swiperEl?.nativeElement;
      if (!el) return;

      this.swiperInstance = new Swiper(el, {
        slidesPerView: 1.05,
        spaceBetween: 12,
        centeredSlides: true,
        loop: true,
        grabCursor: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true
        },
        watchOverflow: true
      });
    } catch {
      this.swiperInstance = null;
    }
  }

  onImgError(ev: Event) {
    const img = ev?.target as HTMLImageElement | null;
    if (img) img.src = 'assets/img/placeholder.png';
  }

  ngOnDestroy(): void {
    if (this.swiperInstance && this.swiperInstance.destroy) {
      this.swiperInstance.destroy(true);
    }
    this.swiperInstance = null;
  }
}