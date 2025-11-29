import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, deleteDoc, collection, collectionData } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteService {

  constructor(
    private firestore: Firestore,
    private afAuth: AngularFireAuth
  ) {}

  async getUid(): Promise<string> {
    const user = await this.afAuth.currentUser;
    if (!user) throw new Error('USER_NOT_LOGGED');
    return user.uid;
  }

  // 🔥 Agregar / quitar favorito
  async toggleFavorite(productId: string): Promise<boolean> {
    const uid = await this.getUid();
    const favRef = doc(this.firestore, `users/${uid}/favoritos/${productId}`);

    const data = await collectionData(
      collection(this.firestore, `users/${uid}/favoritos`),
      { idField: 'id' }
    ).toPromise();

    const exists = data?.some((x: any) => x.id === productId);

    if (exists) {
      await deleteDoc(favRef);
      return false; // ya no es favorito
    } else {
      await setDoc(favRef, {}); // documento vacío
      return true;
    }
  }

  // 🔥 Obtener solo IDs favoritos
  getFavoriteIds(uid: string): Observable<any[]> {
    const ref = collection(this.firestore, `users/${uid}/favoritos`);
    return collectionData(ref, { idField: 'id' });
  }

  // 🔥 Validar rápido si es favorito
  async isFavorited(productId: string): Promise<boolean> {
    const uid = await this.getUid();
    const ref = collection(this.firestore, `users/${uid}/favoritos`);
    const snap = await collectionData(ref, { idField: 'id' }).toPromise();
    return snap?.some((x: any) => x.id === productId) ?? false;
  }
}
