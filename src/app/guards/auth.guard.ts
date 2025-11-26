import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    // permitir acceso si viene ?skip=1 desde el botón "Ahora no"
    const querySkip = state.root.queryParams?.['skip'] === '1' || route.queryParams?.['skip'] === '1';
    if (querySkip) return Promise.resolve(true);

    // asegurar firebase inicializado
    if (!getApps().length) initializeApp(environment.firebase);
    const auth = getAuth();

    // esperar a que Firebase confirme el estado de auth (evita redircciones en F5)
    return new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, user => {
        unsub();
        if (user) {
          resolve(true);
        } else {
          resolve(this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
        }
      }, () => {
        unsub();
        resolve(this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
      });
    });
  }
}