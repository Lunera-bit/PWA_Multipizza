import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { HeaderComponent } from '../../components/header/header/header.component';
import { FooterComponent } from '../../components/footer/footer/footer.component';

interface SizeOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss'],
})
export class CarritoPage implements OnInit, OnDestroy {
  items: CartItem[] = [];
  total = 0;
  private sub?: Subscription;

  // Mapeo de tamaños
  private sizes: SizeOption[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'mediana', label: 'Mediana' },
    { id: 'grande', label: 'Grande' },
    { id: 'familiar', label: 'Familiar' }
  ];

  constructor(
    private cart: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.cart.cart$.subscribe(items => {
      this.items = items || [];
      this.recalc();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private recalc() {
    this.total = this.items.reduce((s, it) => s + ((it.price || 0) * (it.qty || 0)), 0);
  }

  getSizeLabel(sizeId: string): string {
    const size = this.sizes.find(s => s.id === sizeId);
    return size?.label || sizeId || 'Sin tamaño';
  }

  increase(item: CartItem) {
    this.cart.setItemQty(item.id, item.type, (item.qty || 0) + 1);
  }

  decrease(item: CartItem) {
    const n = (item.qty || 0) - 1;
    this.cart.setItemQty(item.id, item.type, n);
  }

  buy() {
    // navega a la pantalla de checkout
    void this.router.navigate(['/clientroute']);
  }
}