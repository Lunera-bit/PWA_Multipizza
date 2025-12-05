import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
      const unsub = onAuthStateChanged(auth, async user => {
        unsub();
        if (user) {
          // Obtener el rol del usuario
          try {
            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const userRole = userData?.['rol'] || 'cliente';

            // Redirigir según el rol en el login
            if (state.url === '/login' && userRole === 'admin') {
              resolve(this.router.createUrlTree(['/dashboard']));
            } else if (state.url === '/login' && userRole === 'cliente') {
              resolve(this.router.createUrlTree(['/inicio']));
            } else {
              resolve(true);
            }
          } catch {
            resolve(true);
          }
        } else {
          resolve(this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
        }
      });
    });
  }
}