import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
  updateProfile,
  updateEmail
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { NotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth!: Auth;
  private user$ = new BehaviorSubject<User | null>(null);
  public authState$: Observable<User | null> = this.user$.asObservable();

  constructor(private userService: UserService, private notifications: NotificationsService) {
    // Inicializar Firebase sólo si hace falta (main.ts ya puede hacerlo, pero por seguridad)
    if (!getApps().length) {
      initializeApp(environment.firebase);
    }
    this.auth = getAuth();
    onAuthStateChanged(this.auth, (u) => this.user$.next(u));

    onAuthStateChanged(this.auth, user => {
      if (user) {
        // arrancar escucha de pedidos para este usuario
        try { this.notifications.startListeningPedidos(user.uid); } catch (e) { console.error(e); }
        try { this.notifications.ensureWelcomeIfNeeded(user.uid, user.displayName ?? undefined); } catch (e) {}
      } else {
        // parar escucha cuando cierre sesión
        try { this.notifications.stopListeningPedidos(); } catch (e) {}
      }
    });
  }

  async signInEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    try { 
      await this.userService.upsertUser(cred.user, 'email'); 
    } catch {}
    return cred;
  }

  async signUpEmail(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    try { 
      // Asignar rol 'cliente' por defecto al registrarse
      await this.userService.upsertUser(cred.user, 'email'); 
    } catch {}
    try { 
      await this.notifications.ensureWelcomeIfNeeded(cred.user.uid, cred.user.displayName ?? undefined); 
    } catch {}
    return cred;
  }

  async sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
  

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(this.auth, provider);
      await this.userService.upsertUser(res.user, 'google');
      try { 
        await this.notifications.ensureWelcomeIfNeeded(res.user.uid, res.user.displayName ?? undefined); 
      } catch {}
      return res;
    } catch {
      const res = await signInWithRedirect(this.auth, provider);
      return res as any;
    }
  }

  async signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    try {
      const res = await signInWithPopup(this.auth, provider);
      await this.userService.upsertUser(res.user, 'apple');
      try { 
        await this.notifications.ensureWelcomeIfNeeded(res.user.uid, res.user.displayName ?? undefined); 
      } catch {}
      return res;
    } catch {
      const res = await signInWithRedirect(this.auth, provider);
      return res as any;
    }
  }

  async logout() {
    return signOut(this.auth);
  }

  currentUser(): User | null {
    return this.auth.currentUser;
  }

  async updateDisplayName(displayName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    await updateProfile(user, { displayName });
    // Actualizar el estado del usuario
    this.user$.next(user);
  }

  async updateEmail(email: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    await updateEmail(user, email);
    // Actualizar el estado del usuario
    this.user$.next(user);
  }
}