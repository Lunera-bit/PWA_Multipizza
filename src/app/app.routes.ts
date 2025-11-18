import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'promociones',
    loadComponent: () => import('./pages/promociones/promociones.page').then(m => m.PromocionesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos.page').then(m => m.PedidosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./pages/favoritos/favoritos.page').then(m => m.FavoritosPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/carrito/carrito.page').then(m => m.CarritoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
  },
  {
    path: 'producto',
    loadComponent: () => import('./pages/producto/producto.page').then(m => m.ProductoPage)
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos.page').then(m => m.ProductosPage)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage)
  }
];


