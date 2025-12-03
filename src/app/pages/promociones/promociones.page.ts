import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { AddToCartComponent } from '../../components/add-to-cart/add-to-cart.component';
import { CartService } from '../../services/cart.service';
import { PromoService, Promo } from '../../services/promo.service';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    RouterLink,
    AddToCartComponent, 
    FooterComponent
  ],
  templateUrl: './promociones.page.html',
  styleUrls: ['./promociones.page.scss'],
})
export class PromocionesPage implements OnInit, OnDestroy {
  promociones: Promo[] = [];
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
          return of([] as Promo[]);
        }),
        finalize(() => {
          this.loading = false;
          console.debug('[PromocionesPage] loading=false, promociones.length=', this.promociones.length);
        })
      )
      .subscribe((list: Promo[]) => {
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

  trackById(_: number, it: Promo) {
    return it.id;
  }

  // abrir detalle de promo (muestra loader mientras navega)
  async openPromo(promo: Promo) {
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

  onAddedPromo(promo: Promo) {
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
