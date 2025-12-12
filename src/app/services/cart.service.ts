import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cart-item.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  
  // mantengo cart$ público para compatibilidad con el código existente
  public cart$ = new BehaviorSubject<CartItem[]>([]);
  // stream público para notificar cuando se añade un ítem (tipo y/o id)
  public added$ = new Subject<{ id: string }>();

  private currentUid: string | null = null;

  constructor(private auth: AuthService, private toastCtrl: ToastController) {
    // sincronizar con estado de auth: cargar carrito del usuario o limpiar al logout
    this.auth.authState$.subscribe(user => {
      if (user && (user as any).uid) {
        this.currentUid = (user as any).uid;
        // solo llamar si tenemos uid (evita pasar null)
        if (this.currentUid) this.loadCartForUser(this.currentUid);
      } else {
        this.currentUid = null;
        // no persistir carrito para invitado -> limpiar en memoria
        this.cart$.next([]);
      }
    });
  }

  private storageKey(uid: string) {
    return `cart_${uid}`;
  }

  private loadCartForUser(uid: string) {
    try {
      const raw = localStorage.getItem(this.storageKey(uid));
      const data: CartItem[] = raw ? JSON.parse(raw) : [];
      this.cart$.next(data);
    } catch {
      this.cart$.next([]);
    }
  }

  private saveCartForUser() {
    if (!this.currentUid) return;
    try {
      localStorage.setItem(this.storageKey(this.currentUid), JSON.stringify(this.cart$.value));
    } catch {}
  }

  // acceso al estado actual
  get items(): CartItem[] {
    return this.cart$.value;
  }

  // añade item (sólo si está logueado)
  addItem(item: CartItem) {
    if (!this.currentUid) {
      this.notifyLoginRequired();
      return;
    }
    const list = [...this.cart$.value];
    const idx = list.findIndex(i => i.id === item.id);
    if (idx > -1) {
      list[idx].qty = (list[idx].qty ?? 0) + (item.qty ?? 1);
    } else {
      list.push({ ...item, qty: item.qty ?? 1 });
    }
    this.cart$.next(list);
    this.saveCartForUser();
    // notificar añadido (para que otras partes reaccionen)
    try { this.added$.next({ id: item.id }); } catch {}
  }

  // compatibilidad: setItemQty usada por otras páginas
  setItemQty(id: string, _type: string | undefined, qty: number) {
    this.updateQty(id, qty);
  }

  updateQty(id: string, qty: number) {
    if (!this.currentUid) {
      this.notifyLoginRequired();
      return;
    }
    const list = this.cart$.value.map(i => i.id === id ? { ...i, qty: Math.max(0, qty) } : i).filter(i => i.qty > 0);
    this.cart$.next(list);
    this.saveCartForUser();
  }

  removeItem(id: string) {
    if (!this.currentUid) {
      this.notifyLoginRequired();
      return;
    }
    const list = this.cart$.value.filter(i => i.id !== id);
    this.cart$.next(list);
    this.saveCartForUser();
  }

  clearCart() {
    if (!this.currentUid) {
      this.notifyLoginRequired();
      return;
    }
    this.cart$.next([]);
    this.saveCartForUser();
  }

  // helper: notificar que necesita login
  private async notifyLoginRequired() {
    const t = await this.toastCtrl.create({
      message: 'Inicia sesión para usar el carrito',
      duration: 1400,
      position: 'bottom'
    });
    await t.present();
  }

  /**
   * Obtener el total del carrito
   */
  getTotal(): number {
    return this.cart$.value.reduce((total, item) => total + (item.price * item.qty), 0);
  }

  /**
   * Obtener los items del carrito para crear una orden
   */
  getCartForOrder() {
    return {
      items: this.cart$.value,
      total: this.getTotal()
    };
  }
}