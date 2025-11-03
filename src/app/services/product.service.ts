import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  categoria?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private firestore: Firestore) {}

  // obtiene todos los productos (colección 'products')
  getProducts(): Observable<Product[]> {
    const collRef = collection(this.firestore, 'products');
    return collectionData(collRef, { idField: 'id' }) as Observable<Product[]>;
  }

  // producto por id (doc)
  getProductById(id: string): Observable<Product | undefined> {
    const docRef = doc(this.firestore, `products/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Product | undefined>;
  }
}