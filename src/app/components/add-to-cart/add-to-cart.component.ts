import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.scss']
})
export class AddToCartComponent {
  // acepta tanto `item` como `product` por compatibilidad con distintas plantillas
  @Input() item: any;
  @Input() qty = 1;
  @Input() size: 'small' | 'default' = 'small';

  // alias `product` que asigna a `item` para compatibilidad: <app-add-to-cart [product]="product">
  @Input() set product(v: any) { this.item = v; }

  @Output() added = new EventEmitter<void>();

  constructor(private cart: CartService, private toastCtrl: ToastController) {}

  async onAdd() {
    if (!this.item || !this.item.id) return;
    const payload = {
      id: this.item.id,
      type: (this.item.type as string) ?? (this.item.productoIds ? 'promo' : 'product'),
      title: this.item.nombre ?? this.item.title ?? 'Ítem',
      price: (this.item.precio ?? this.item.precioEspecial ?? 0) as number,
      qty: this.qty,
      meta: this.item.meta ?? {}
    };
    this.cart.addItem(payload);
    this.added.emit();
    const t = await this.toastCtrl.create({ message: 'Añadido al carrito', duration: 900, position: 'bottom' });
    t.present();
  }
}