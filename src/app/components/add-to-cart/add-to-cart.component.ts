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
  @Input() item: any;
  @Input() qty = 1;
  @Input() size: 'small' | 'default' = 'small';
  @Input() selectedSize: string = 'personal';

  @Input() set product(v: any) { this.item = v; }

  @Output() added = new EventEmitter<void>();

  // Multiplicadores de precio por tamaño
  private sizeMultipliers: { [key: string]: number } = {
    'personal': 1,
    'mediana': 1.4,
    'grande': 1.6,
    'familiar': 1.8
  };

  constructor(private cart: CartService, private toastCtrl: ToastController) {}

  async onAdd() {
    if (!this.item || !this.item.id) return;
    
    // Calcular precio con multiplicador de tamaño
    const basePrice = (this.item.precio ?? this.item.precioEspecial ?? 0) as number;
    const multiplier = this.sizeMultipliers[this.selectedSize] ?? 1;
    const finalPrice = basePrice * multiplier;

    const payload = {
      id: this.item.id,
      type: (this.item.type as string) ?? (this.item.productoIds ? 'promo' : 'product'),
      title: this.item.nombre ?? this.item.title ?? 'Ítem',
      price: finalPrice,
      qty: this.qty,
      size: this.selectedSize,
      meta: this.item.meta ?? {}
    };
    
    this.cart.addItem(payload);
    this.added.emit();
    const t = await this.toastCtrl.create({ 
      message: `Añadido al carrito (${this.selectedSize})`, 
      duration: 900, 
      position: 'bottom' 
    });
    t.present();
  }
}