import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { AddToCartComponent } from '../../components/add-to-cart/add-to-cart.component';
import { CartService } from '../../services/cart.service';
import { PromoService } from '../../services/promo.service';
import { Promocion } from 'src/app/models/promocion.model';

import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [IonicModule, CommonModule, AddToCartComponent],
  templateUrl: './promociones.page.html',
  styleUrls: ['./promociones.page.scss'],
})
export class PromocionesPage implements OnInit, OnDestroy {
  promociones: Promocion[] = [];
  cartMap: Record<string, number> = {};
  private destroy$ = new Subject<void>();
  loading = true;
  errorMsg?: string;

  constructor(
    private promoSvc: PromoService,
    private cart: CartService,
    private router: Router,
    private loader: LoaderService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.errorMsg = undefined;

    this.promoSvc
      .getPromos()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('[PromocionesPage] Error cargando promociones', err);
          this.errorMsg = 'No se pudieron cargar las promociones. Intenta más tarde.';
          return of([] as Promocion[]);
        }),
        finalize(() => {
          this.loading = false;
          console.debug('[PromocionesPage] loading=false, promociones.length=', this.promociones.length);
        })
      )
      .subscribe((list: Promocion[]) => {
        console.debug('[PromocionesPage] subscribe -> list:', list);
        this.promociones = list || [];
      });

    // mantener mapa de cantidades en carrito
    this.cart.cart$.pipe(takeUntil(this.destroy$)).subscribe((items) => {
      const map: Record<string, number> = {};
      (items || []).forEach((i) => {
        map[i.id] = (map[i.id] ?? 0) + (i.qty || 1);
      });
      this.cartMap = map;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(_: number, it: Promocion) {
    return it.id;
  }

  // abrir detalle de promo (muestra loader mientras navega)
  async openPromo(promo: Promocion) {
    if (!promo?.id) return;
    try {
      await this.loader.show('Cargando promoción...');
      await this.router.navigateByUrl(`/promocion/${promo.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      await this.loader.hide();
    }
  }

  onAddedPromo(promo: Promocion) {
    // el CartService ya gestiona la validación de login y persistencia
    console.log('Añadido al carrito:', promo?.id);
  }

  // reemplaza la imagen por placeholder si falla la carga
  onImgError(ev: Event) {
    try {
      const img = ev?.target as HTMLImageElement | null;
      if (img) img.src = 'assets/img/placeholder.png';
    } catch {}
  }
}
