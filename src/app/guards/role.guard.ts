import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const requiredRole = route.data['role'] as string;

    if (!requiredRole) return true; // Sin restricción de rol

    if (!getApps().length) initializeApp(environment.firebase);
    const auth = getAuth();

    return new Promise(resolve => {
      onAuthStateChanged(auth, async user => {
        if (!user) {
          resolve(this.router.createUrlTree(['/login']));
          return;
        }

        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const userRole = userData?.['rol'] || 'cliente';

          if (userRole === requiredRole) {
            resolve(true);
          } else {
            if (userRole === 'admin') {
              resolve(this.router.createUrlTree(['/dashboard']));
            } else {
              resolve(this.router.createUrlTree(['/inicio']));
            }
          }
        } catch (error) {
          console.error('Error verificando rol:', error);
          resolve(this.router.createUrlTree(['/inicio']));
        }
      });
    });
  }
}