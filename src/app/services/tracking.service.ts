import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface LocationUpdate {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface DistanceInfo {
  distance: number; // en km
  duration: number; // en minutos estimados
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private currentLocation$ = new BehaviorSubject<LocationUpdate | null>(null);
  private locationWatchId: number | null = null;
  private db = getFirestore();
  private unsubscribe: Unsubscribe | null = null;
  private isMobileDevice = Capacitor.isNativePlatform();

  constructor() {}

  /**
   * Obtener ubicación del dispositivo (móvil o navegador)
   */
  private async getDeviceLocation(): Promise<LocationUpdate> {
    try {
      if (this.isMobileDevice) {
        // En dispositivo móvil, usar Capacitor Geolocation
        try {
          const position = await Geolocation.getCurrentPosition();
          return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.warn('Error getting location from Capacitor, falling back to browser API:', error);
          // Fallback a Geolocation API del navegador
          return this.getBrowserLocation();
        }
      } else {
        // En navegador, usar Geolocation API
        return this.getBrowserLocation();
      }
    } catch (error) {
      console.error('Error getting device location:', error);
      throw error;
    }
  }

  /**
   * Obtener ubicación usando Geolocation API del navegador
   */
  private getBrowserLocation(): Promise<LocationUpdate> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now(),
            });
          },
          (error) => {
            console.error('Browser geolocation error:', error);
            
            // Si el timeout expira o hay un error, intentar con menos precisión
            if (error.code === 3 || error.code === 1) {
              console.warn('Retrying with lower accuracy requirements...');
              navigator.geolocation.getCurrentPosition(
                (fallbackPosition) => {
                  resolve({
                    lat: fallbackPosition.coords.latitude,
                    lng: fallbackPosition.coords.longitude,
                    timestamp: Date.now(),
                  });
                },
                (fallbackError) => {
                  reject(new Error(`Geolocation error: ${fallbackError.message}`));
                },
                {
                  enableHighAccuracy: false, // Menos preciso pero más rápido
                  timeout: 15000,
                  maximumAge: 30000, // Acepta datos de hace 30 segundos
                }
              );
            } else {
              reject(new Error(`Geolocation error: ${error.message}`));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Aumentado a 15 segundos
            maximumAge: 0,
          }
        );
      } else {
        reject(new Error('Geolocation not supported by this browser'));
      }
    });
  }

  /**
   * Iniciar seguimiento de ubicación en tiempo real para delivery
   */
  async startDeliveryTracking(orderId: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) throw new Error('No authenticated user');

    try {
      // Obtener ubicación inicial (Capacitor si es móvil, navegador si es web)
      const location = await this.getDeviceLocation();

      // Actualizar ubicación en Firestore
      await this.updateDeliveryLocation(orderId, location);
      this.currentLocation$.next(location);

      // Monitoreo continuo cada 10 segundos
      this.locationWatchId = setInterval(async () => {
        try {
          const newLocation = await this.getDeviceLocation();
          this.currentLocation$.next(newLocation);
          await this.updateDeliveryLocation(orderId, newLocation);
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, 10000);
    } catch (error) {
      console.error('Error starting delivery tracking:', error);
      throw error;
    }
  }

  /**
   * Detener seguimiento de ubicación
   */
  stopDeliveryTracking(): void {
    if (this.locationWatchId) {
      clearInterval(this.locationWatchId);
      this.locationWatchId = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Actualizar ubicación en Firestore
   */
  private async updateDeliveryLocation(
    orderId: string,
    location: LocationUpdate
  ): Promise<void> {
    try {
      const orderRef = doc(this.db, 'pedidos', orderId);
      await updateDoc(orderRef, {
        'deliveryPerson.currentLocation': {
          lat: location.lat,
          lng: location.lng,
        },
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating location in Firestore:', error);
    }
  }

  /**
   * Obtener ubicación actual del delivery
   */
  getCurrentLocation(): Observable<LocationUpdate | null> {
    return this.currentLocation$.asObservable();
  }

  /**
   * Escuchar ubicación de un delivery en tiempo real
   */
  listenToDeliveryLocation(
    orderId: string,
    onLocation: (location: LocationUpdate | null) => void
  ): () => void {
    const orderRef = doc(this.db, 'pedidos', orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        const data = snapshot.data() as any;
        if (data?.deliveryPerson?.currentLocation) {
          onLocation({
            lat: data.deliveryPerson.currentLocation.lat,
            lng: data.deliveryPerson.currentLocation.lng,
            timestamp: data.updatedAt?.toMillis?.() || Date.now(),
          });
        }
      },
      (error) => {
        console.error('Error listening to delivery location:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Calcular distancia en km entre dos coordenadas (Fórmula Haversine)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertir grados a radianes
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estimar tiempo de entrega (basado en distancia y velocidad promedio de 30 km/h)
   */
  estimateDeliveryTime(distanceKm: number): number {
    const averageSpeed = 30; // km/h
    return Math.ceil((distanceKm / averageSpeed) * 60); // minutos
  }

  /**
   * Obtener ubicación actual del dispositivo (una sola vez)
   * Usa Capacitor en móvil o Geolocation API en navegador
   */
  async getCurrentDeviceLocation(): Promise<LocationUpdate> {
    return this.getDeviceLocation();
  }
}
