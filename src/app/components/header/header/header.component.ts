import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { NotificationsService } from '../../../services/notifications.service'; // ajustar ruta si hace falta
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title = 'MultiPizza';
  @Input() notificacionesCount = 0;
  carritoCount = 0;
  cartIcon = 'cart-outline';
  cartPulse = false;
  private cartSub?: Subscription;
  private _prevCartCount = 0;

  // perfil
  defaultAvatar = 'assets/img/avatar-default.svg';
  photo = this.defaultAvatar;
  displayName = 'Usuario';
  displayEmail = '';

  isLoggedIn = false;

  private sub?: Subscription;
  private notifsUnsub?: () => void;

  constructor(
    private router: Router,
    private menu: MenuController,
    private auth: AuthService,
    private cart: CartService,
    private notifications: NotificationsService // inyectado
  ) {}

  ngOnInit(): void {
    this.sub = this.auth.authState$.subscribe(u => {
      this.isLoggedIn = !!u;
      this.displayName = u?.displayName || 'Usuario';
      this.displayEmail = u?.email || '';
      this.photo = (u as any)?.photoURL || this.defaultAvatar;

      // (re)suscribir al conteo de notificaciones sólo si hay usuario
      if (this.notifsUnsub) { this.notifsUnsub(); this.notifsUnsub = undefined; }
      if (u?.uid) {
        this.notifsUnsub = this.notifications.observeUnreadCount(u.uid, cnt => {
          this.notificacionesCount = cnt;
        });
      } else {
        this.notificacionesCount = 0;
      }
    });

    // suscribir al carrito para mostrar la badge con total de items (qty)
    this.cartSub = this.cart.cart$?.subscribe(items => {
      const total = (items || []).reduce((s, it) => s + (it.qty || 0), 0);
      // pulse si se incrementó
      if (total > this._prevCartCount) {
        this.cartPulse = true;
        setTimeout(() => (this.cartPulse = false), 700);
      }
      this._prevCartCount = total;
      this.carritoCount = total;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.cartSub?.unsubscribe();
    if (this.notifsUnsub) this.notifsUnsub();
  }

  onImgError() {
    this.photo = this.defaultAvatar;
  }

  // abrir/cerrar menú programáticamente
  async openMenu() {
    try { await this.menu.open('profileMenu'); } catch { /* ignore */ }
  }
  async closeMenu() {
    try { await this.menu.close('profileMenu'); } catch { /* ignore */ }
  }
  async toggleMenu() {
    try { await this.menu.toggle('profileMenu'); } catch { /* ignore */ }
  }

  // prompt local para cambiar sólo el nombre mostrado (sin backend)
  editName() {
    const n = window.prompt('Nuevo nombre', this.displayName || '');
    if (!n) return;
    const v = n.trim();
    if (v.length < 2) {
      window.alert('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    this.displayName = v;
  }

  goToLogin() {
    void this.menu.close('profileMenu').then(() => void this.router.navigate(['/login']));
  }

  async logout() {
    try {
      await this.auth.logout();
      await this.menu.close('profileMenu');
      // limpiar UI local
      this.isLoggedIn = false;
      this.displayName = 'Usuario';
      this.displayEmail = '';
      this.photo = this.defaultAvatar;
      void this.router.navigate(['/']);
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  openCart() {
    void this.router.navigate(['/carrito']);
  }

  // nuevo: navegar a la bandeja de notificaciones
  openBandeja() {
    void this.router.navigate(['/bandeja-notificaciones']);
  }
}