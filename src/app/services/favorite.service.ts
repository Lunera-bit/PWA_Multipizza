import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  constructor(private afAuth: AngularFireAuth) {}

  private storageKey(uid: string) {
    return `favorites_${uid}`;
  }

  // obtiene uid actual (o null)
  async getUid(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  // lee array de ids de localStorage para uid
  getFavoritesSync(uid: string): string[] {
    const raw = localStorage.getItem(this.storageKey(uid));
    try {
      return raw ? JSON.parse(raw) as string[] : [];
    } catch {
      return [];
    }
  }

  // guarda array
  private saveFavoritesSync(uid: string, ids: string[]) {
    localStorage.setItem(this.storageKey(uid), JSON.stringify(Array.from(new Set(ids))));
  }

  // togglea y devuelve nuevo estado (true = ahora es favorito)
  async toggleFavorite(productId: string): Promise<boolean> {
    const uid = await this.getUid();
    if (!uid) throw new Error('USER_NOT_LOGGED');
    const list = this.getFavoritesSync(uid);
    const idx = list.indexOf(productId);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.saveFavoritesSync(uid, list);
      return false;
    } else {
      list.push(productId);
      this.saveFavoritesSync(uid, list);
      return true;
    }
  }

  // comprobación rápida
  async isFavorited(productId: string): Promise<boolean> {
    const uid = await this.getUid();
    if (!uid) return false;
    return this.getFavoritesSync(uid).includes(productId);
  }

  // nuevo: establece explícitamente el estado favorito y devuelve el estado resultante
  async setFavorited(productId: string, favorited: boolean): Promise<boolean> {
    const uid = await this.getUid();
    if (!uid) throw new Error('USER_NOT_LOGGED');
    const list = this.getFavoritesSync(uid);
    const has = list.includes(productId);
    if (favorited) {
      if (!has) {
        list.push(productId);
        this.saveFavoritesSync(uid, list);
      }
      return true;
    } else {
      if (has) {
        const idx = list.indexOf(productId);
        list.splice(idx, 1);
        this.saveFavoritesSync(uid, list);
      }
      return false;
    }
  }
}