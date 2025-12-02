import { Injectable } from '@angular/core';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { StorageService } from './storage.service';
import { Observable, from } from 'rxjs';

export interface Promo {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  imagenUrl?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class PromoService {
  constructor(private storageSvc: StorageService) {}

  getPromos(): Observable<Promo[]> {
    return from(this.fetchPromos());
  }

  private async fetchPromos(): Promise<Promo[]> {
    try {
      const db = getFirestore();
      const promoRef = collection(db, 'promo');
      const snapshot = await getDocs(promoRef);
      
      const promos: Promo[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as any;
        const promo: Promo = {
          id: doc.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio,
          imagen: data.imagen
        };
        
        // Cargar URL de Storage: promos/[imagen]
        if (promo.imagen && typeof promo.imagen === 'string') {
          try {
            const imagePath = `promos/${promo.imagen}`;
            promo.imagenUrl = await this.storageSvc.getImageUrl(imagePath);
          } catch (error) {
            console.error(`Error cargando imagen de promo ${promo.id}:`, error);
            promo.imagenUrl = 'assets/img/placeholder.png';
          }
        } else {
          promo.imagenUrl = 'assets/img/placeholder.png';
        }
        
        promos.push(promo);
      }
      
      return promos;
    } catch (error) {
      console.error('Error obteniendo promos:', error);
      return [];
    }
  }

  async getPromoById(id: string): Promise<Promo | null> {
    try {
      const db = getFirestore();
      const docRef = collection(db, 'promo');
      const snapshot = await getDocs(docRef);
      
      const doc = snapshot.docs.find(d => d.id === id);
      if (!doc) return null;
      
      const data = doc.data() as any;
      const promo: Promo = {
        id: doc.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        imagen: data.imagen
      };
      
      // Cargar URL de Storage: promos/[imagen]
      if (promo.imagen && typeof promo.imagen === 'string') {
        try {
          const imagePath = `promos/${promo.imagen}`;
          promo.imagenUrl = await this.storageSvc.getImageUrl(imagePath);
        } catch (error) {
          console.error(`Error cargando imagen de promo:`, error);
          promo.imagenUrl = 'assets/img/placeholder.png';
        }
      } else {
        promo.imagenUrl = 'assets/img/placeholder.png';
      }
      
      return promo;
    } catch (error) {
      console.error('Error obteniendo promo:', error);
      return null;
    }
  }
}
