import { Injectable } from '@angular/core';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  Unsubscribe
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private currentUser: User | null = null;
  private authUnsub?: () => void;

  constructor() {
    const auth = getAuth();
    // mantener referencia al usuario actual
    this.currentUser = auth.currentUser;
    this.authUnsub = onAuthStateChanged(auth, u => (this.currentUser = u)) as unknown as () => void;
  }

  private getUidSync(): string | null {
    return this.currentUser?.uid ?? null;
  }

  private favCollectionRef(uid: string): CollectionReference {
    return collection(getFirestore(), 'usuarios', uid, 'favorites');
  }

  private favDocRef(uid: string, productId: string): DocumentReference {
    return doc(getFirestore(), 'usuarios', uid, 'favorites', productId);
  }

  async setFavorited(productId: string, favorited: boolean): Promise<void> {
    const uid = this.getUidSync();
    if (!uid) throw new Error('USER_NOT_LOGGED');
    const ref = this.favDocRef(uid, productId);
    if (favorited) {
      await setDoc(ref, { productId, createdAt: serverTimestamp() });
    } else {
      await deleteDoc(ref);
    }
  }

  async toggleFavorite(productId: string): Promise<boolean> {
    const current = await this.isFavorited(productId);
    await this.setFavorited(productId, !current);
    return !current;
  }

  async isFavorited(productId: string): Promise<boolean> {
    const uid = this.getUidSync();
    if (!uid) return false;
    const ref = this.favDocRef(uid, productId);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  // Observa un doc favorited en tiempo real; cb recibe true/false. Devuelve unsubscribe.
  observeIsFavorited(productId: string, cb: (v: boolean) => void): Unsubscribe {
    const uid = this.getUidSync();
    let unsub: Unsubscribe = () => {};
    if (!uid) {
      // esperar a auth si aún no hay user (suscripción temporal)
      const auth = getAuth();
      const au = onAuthStateChanged(auth, user => {
        try { au(); } catch {}
        if (!user) { cb(false); return; }
        unsub = onSnapshot(this.favDocRef(user.uid, productId), s => cb(s.exists()), err => {
          console.error('[FavoriteService] observeIsFavorited onSnapshot error', err);
          cb(false);
        });
      }) as unknown as Unsubscribe;
      return () => {
        try { au(); } catch {}
        try { unsub(); } catch {}
      };
    } else {
      unsub = onSnapshot(this.favDocRef(uid, productId), s => cb(s.exists()), err => {
        console.error('[FavoriteService] observeIsFavorited onSnapshot error', err);
        cb(false);
      });
      return unsub;
    }
  }

  // Observa todos los favoritos (ids) en tiempo real; cb recibe array de ids. Devuelve unsubscribe.
  observeFavorites(cb: (ids: string[]) => void): Unsubscribe {
    const uid = this.getUidSync();
    let unsub: Unsubscribe = () => {};
    if (!uid) {
      const auth = getAuth();
      const au = onAuthStateChanged(auth, user => {
        try { au(); } catch {}
        if (!user) { cb([]); return; }
        unsub = onSnapshot(this.favCollectionRef(user.uid), snap => {
          cb(snap.docs.map(d => (d.data() as any).productId || d.id));
        }, err => {
          console.error('[FavoriteService] observeFavorites onSnapshot error', err);
          cb([]);
        });
      }) as unknown as Unsubscribe;
      return () => {
        try { au(); } catch {}
        try { unsub(); } catch {}
      };
    } else {
      unsub = onSnapshot(this.favCollectionRef(uid), snap => {
        cb(snap.docs.map(d => (d.data() as any).productId || d.id));
      }, err => {
        console.error('[FavoriteService] observeFavorites onSnapshot error', err);
        cb([]);
      });
      return unsub;
    }
  }

  ngOnDestroy(): void {
    try { this.authUnsub?.(); } catch {}
  }
}