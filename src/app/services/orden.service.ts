import { Injectable } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Query,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderStatus } from '../models/orden.model';

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private db!: Firestore;
  private ordenes$ = new BehaviorSubject<Order[]>([]);
  private unsubscribe: Unsubscribe | null = null;

  constructor() {
    if (!getApps().length) {
      initializeApp(environment.firebase);
    }
    this.db = getFirestore();
  }

  /**
   * Obtener todas las órdenes (para admin)
   */
  getAllOrdenes(): Observable<Order[]> {
    this.startListeningAllOrdenes();
    return this.ordenes$.asObservable();
  }

  /**
   * Escuchar cambios en tiempo real para todas las órdenes
   */
  private startListeningAllOrdenes() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const q = query(
      collection(this.db, 'pedidos'),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const ordenes: Order[] = [];
      snapshot.forEach((doc) => {
        ordenes.push({ id: doc.id, ...doc.data() } as Order);
      });
      this.ordenes$.next(ordenes);
    }, (error) => {
      console.error('Error listening to ordenes:', error);
    });
  }

  /**
   * Obtener órdenes de un usuario específico
   */
  async getOrdenesByUserId(userId: string): Promise<Order[]> {
    const q = query(
      collection(this.db, 'pedidos'),
      where('user.uid', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const ordenes: Order[] = [];
    snapshot.forEach((doc) => {
      ordenes.push({ id: doc.id, ...doc.data() } as Order);
    });
    return ordenes;
  }

  /**
   * Obtener una orden por ID
   */
  async getOrdenById(id: string): Promise<Order | null> {
    const docRef = doc(this.db, 'pedidos', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  }

  /**
   * Crear una nueva orden
   */
  async createOrden(orden: Order): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'pedidos'), {
        ...orden,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating orden:', error);
      throw error;
    }
  }

  /**
   * Actualizar una orden
   */
  async updateOrden(id: string, data: Partial<Order>): Promise<void> {
    try {
      const docRef = doc(this.db, 'pedidos', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating orden:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de una orden
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    return this.updateOrden(id, { status });
  }

  /**
   * Eliminar una orden
   */
  async deleteOrden(id: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'pedidos', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting orden:', error);
      throw error;
    }
  }

  /**
   * Detener la escucha de cambios
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
