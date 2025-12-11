import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, query, where } from '@angular/fire/firestore';
  import { addDoc } from '@angular/fire/firestore';
    import { deleteDoc } from '@angular/fire/firestore';
    import { updateDoc } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  categoria?: string;
  tags?: string[]; // opcional: sólo para pizzas
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

  /**
   * Consulta flexible:
   * - Si se pasa `category` se filtra por categoría.
   * - Si se pasan `tags` se aplican SOLO cuando la categoría indicada es "pizza" / "pizzas".
   * - Si se pasa maxPrice se añade where('precio', '<=', maxPrice).
   *
   * Nota: Firestore no permite combinar cualquier tipo de cláusula arbitraria;
   * si necesitas queries más complejas, considera hacer filtrado parcial en cliente.
   */
  getProductsFiltered(category?: string, tags?: string[], maxPrice?: number): Observable<Product[]> {
    const coll = collection(this.firestore, 'products');
    const clauses: any[] = [];

    if (category) {
      clauses.push(where('categoria', '==', category));
    }

    if (typeof maxPrice === 'number') {
      clauses.push(where('precio', '<=', maxPrice));
    }

    // Aplicar tags SOLO para categoría pizza/pizzas
    const catLower = (category || '').toString().toLowerCase();
    const isPizzaCat = catLower === 'pizza' || catLower === 'pizzas';
    if (tags && tags.length && isPizzaCat) {
      // array-contains-any sobre campo 'tags'
      clauses.push(where('tags', 'array-contains-any', tags));
    }

    // Si no hay cláusulas devolvemos todos (collectionData)
    if (clauses.length === 0) {
      return collectionData(coll, { idField: 'id' }) as Observable<Product[]>;
    }

    // Construir query con cláusulas
    const q = query(coll, ...clauses);
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }





  //borrar productos

deleteProduct(id: string) {
  const docRef = doc(this.firestore, `products/${id}`);
  return deleteDoc(docRef);
}

// actulizar prodcutos
  updateProducto(id: string, data: any) {
    const ref = doc(this.firestore, `products/${id}`);
    return updateDoc(ref, data);
  }


  // agregar prodcuto
addProduct(product: Product) {
  const collRef = collection(this.firestore, 'products');
  return addDoc(collRef, product);
}
}