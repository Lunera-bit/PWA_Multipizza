import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductService } from '../../services/product.service';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { AddToCartComponent } from '../../components/add-to-cart/add-to-cart.component';
import { FavoriteButtonComponent } from '../../components/favorite-button/favorite-button.component';

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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: ProductService
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

  private loadProductById(id: string) {
    this.loading = true;
    this.productSvc.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (list: any[]) => {
        const found = (list || []).find(p =>
          (p.id ?? p._id ?? p.idProducto ?? p['id'] ?? '').toString() === id.toString()
        );
        this.product = this.normalize(found ?? null);
        this.isFavorited = !!(this.product && this.product.favorited);
        this.loading = false;
      },
      error: () => {
        this.product = null;
        this.loading = false;
      }
    });
  }

  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
    console.log('favorite toggle', this.product?.id, this.isFavorited);
    // persistir con servicio si existe
  }

  goHome() {
    void this.router.navigate(['/inicio']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}