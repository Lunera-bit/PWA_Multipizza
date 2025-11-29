import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  deleteDoc,
  setDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteService {

  constructor(private firestore: Firestore) {}

  /** Guarda un favorito en usuarios/{uid}/favoritos/{productId} */
  setFavorite(uid: string, productId: string) {
    const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${productId}`);
    return setDoc(ref, { productId });
  }

  /** Elimina el favorito */
  removeFavorite(uid: string, productId: string) {
    const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${productId}`);
    return deleteDoc(ref);
  }

  /** Obtiene todos los favoritos del usuario */
  getFavorites(uid: string): Observable<any[]> {
    const ref = collection(this.firestore, `usuarios/${uid}/favoritos`);
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }


  /** Alterna entre agregar o eliminar un favorito */
async toggleFavorite(uid: string, productId: string) {
  const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${productId}`);

  const exists = await new Promise<boolean>(resolve => {
    docData(ref).subscribe(d => resolve(!!d));
  });

  if (exists) {
    return deleteDoc(ref); // ya existe → eliminar
  } else {
    return setDoc(ref, { productId }); // no existe → crear
  }
}

  /** Verifica si un producto YA ES favorito */
  isFavorite(uid: string, productId: string): Observable<any | undefined> {
    const ref = doc(this.firestore, `usuarios/${uid}/favoritos/${productId}`);
    return docData(ref) as Observable<any | undefined>;
  }

}
