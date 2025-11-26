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
  User
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from './user.service'; // <-- nuevo import

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth!: Auth;
  private user$ = new BehaviorSubject<User | null>(null);
  public authState$: Observable<User | null> = this.user$.asObservable();

  constructor(private userService: UserService) {  // <-- inyectar UserService
    // Inicializar Firebase sólo si hace falta (main.ts ya puede hacerlo, pero por seguridad)
    if (!getApps().length) {
      initializeApp(environment.firebase);
    }
    this.auth = getAuth();
    onAuthStateChanged(this.auth, (u) => this.user$.next(u));
  }

  async signInEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    // actualizar/crear registro usuario
    try { await this.userService.upsertUser(cred.user, 'email'); } catch {}
    return cred;
  }

  async signUpEmail(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    try { await this.userService.upsertUser(cred.user, 'email'); } catch {}
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
      return res;
    } catch {
      const res = await signInWithRedirect(this.auth, provider);
      // note: con redirect no se obtiene resultado inmediato para upsert; onAuthStateChanged cubrirá la creación en ese caso
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
}