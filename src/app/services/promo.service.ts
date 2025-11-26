import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Promocion } from '../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class PromoService {
  constructor(private firestore: Firestore) {}

  // obtiene todas las promociones
  getPromos(): Observable<Promocion[]> {
    const collRef = collection(this.firestore, 'promo'); // asegúrate que la colección se llame exactamente 'promo'
    const q = query(collRef, orderBy('precio', 'asc'));
    return collectionData(q, { idField: 'id' }).pipe(
      tap(docs => console.debug('[PromoService] getPromos -> docs:', docs)),
      map((arr: any[]) => arr.map(d => new Promocion(d)))
    );
  }

  // obtiene promoción por id
  getPromoById(id: string): Observable<Promocion | undefined> {
    const docRef = doc(this.firestore, `promo/${id}`);
    return docData(docRef, { idField: 'id' }).pipe(
      map((d: any) => (d ? new Promocion(d) : undefined))
    );
  }
}
