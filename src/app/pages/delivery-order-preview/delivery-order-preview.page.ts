import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSpinner,
  IonLabel,
  IonBadge,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Order } from '../../models/orden.model';
import { MapboxRoutingService } from '../../services/mapbox-routing.service';
import { TrackingService, LocationUpdate } from '../../services/tracking.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { mapOutline, navigateOutline, checkmarkDoneOutline, closeOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-delivery-order-preview',
  templateUrl: './delivery-order-preview.page.html',
  styleUrls: ['./delivery-order-preview.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonSpinner,
    IonLabel,
    IonBadge,
  ],
})
export class DeliveryOrderPreviewPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef;

  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  isAccepting = false;
  currentLocation: LocationUpdate | null = null;
  distance: number | null = null;
  estimatedTime: number | null = null;
  deliveryAddress: string = '';

  private map?: any;
  private mapboxgl: any;
  private unsubscribeOrder?: Unsubscribe;
  private currentUserId: string | null = null;
  private mapReadyToInit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mapboxRoutingService: MapboxRoutingService,
    private trackingService: TrackingService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ mapOutline, navigateOutline, checkmarkDoneOutline, closeOutline, timeOutline });
  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    if (!this.orderId) {
      this.showError('No se especificó el pedido');
      return;
    }

    const auth = getAuth();
    this.currentUserId = auth.currentUser?.uid || null;

    this.loadOrder();
    // No esperar a getCurrentLocation, hacerlo en paralelo
    this.getCurrentLocation().catch(() => {
      console.warn('No se pudo obtener ubicación actual');
    });
  }

  ngAfterViewInit() {
    console.log('Vista inicializada, contenedor disponible');
    this.mapReadyToInit = true;
    
    // Si el orden ya fue cargado, inicializar mapa ahora
    if (this.order && this.mapContainer) {
      console.log('Inicializando mapa (AfterViewInit)');
      this.initMap().catch((err) => console.error('Error en mapa:', err));
      this.calculateDistance().catch((err) => console.error('Error en distancia:', err));
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeOrder) {
      this.unsubscribeOrder();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private loadOrder() {
    const db = getFirestore();
    const orderRef = doc(db, 'pedidos', this.orderId);

    this.unsubscribeOrder = onSnapshot(orderRef, async (docSnap) => {
      if (docSnap.exists()) {
        this.order = docSnap.data() as Order;
        if (!this.order.id) {
          this.order.id = docSnap.id;
        }
        this.deliveryAddress = this.getAddressString();
        
        // Marcar como cargado para mostrar el mapa inmediatamente
        this.isLoading = false;
        
        // Inicializar mapa solo si la vista ya está lista
        if (this.mapReadyToInit && this.mapContainer) {
          console.log('Inicializando mapa (desde loadOrder)');
          this.initMap().catch((err) => console.error('Error en mapa:', err));
          this.calculateDistance().catch((err) => console.error('Error en distancia:', err));
        } else {
          console.log('Mapa aún no listo, esperando AfterViewInit');
        }
      } else {
        this.showError('Pedido no encontrado');
        this.isLoading = false;
      }
    });
  }

  private async getCurrentLocation() {
    try {
      // Timeout de 5 segundos para no bloquear
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject('Timeout de ubicación'), 5000)
      );
      this.currentLocation = await Promise.race([
        this.trackingService.getCurrentDeviceLocation(),
        timeout,
      ]);
    } catch (error) {
      console.warn('No se pudo obtener ubicación actual:', error);
      this.currentLocation = null; // Mostrar mapa sin ubicación actual
    }
  }

  private async initMap() {
    if (!this.mapContainer || !this.order?.address?.coordinates) {
      console.error('No se puede inicializar mapa: contenedor o coordenadas faltantes');
      return;
    }

    console.log('Inicializando mapa...');

    // Cargar Mapbox GL
    await this.loadMapboxGL();

    if (!this.map && this.mapContainer.nativeElement) {
      const customerLng = this.getCoordinateLng(this.order.address.coordinates);
      const customerLat = this.getCoordinateLat(this.order.address.coordinates);

      console.log('Creando mapa en coordenadas:', customerLat, customerLng);

      try {
        this.map = new this.mapboxgl.Map({
          container: this.mapContainer.nativeElement,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [customerLng, customerLat],
          zoom: 14,
        });

        console.log('Mapa creado exitosamente');

        this.map.on('load', () => {
          console.log('Mapa cargado, añadiendo marcadores');
          this.addMarkers();
        });

        this.map.on('error', (err: any) => {
          console.error('Error en mapa:', err);
        });
      } catch (error) {
        console.error('Error creando mapa:', error);
      }
    }
  }

  private loadMapboxGL() {
    return new Promise<void>((resolve) => {
      console.log('Cargando Mapbox GL...');
      
      if ((window as any).mapboxgl) {
        console.log('Mapbox GL ya está cargado');
        this.mapboxgl = (window as any).mapboxgl;
        this.mapboxgl.accessToken = environment.mapboxToken;
        resolve();
      } else {
        console.log('Cargando script de Mapbox GL desde CDN');
        // Si no está cargado, intentar cargarlo
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Script de Mapbox GL cargado');
          this.mapboxgl = (window as any).mapboxgl;
          this.mapboxgl.accessToken = environment.mapboxToken;
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.css';
          document.head.appendChild(link);
          console.log('Token de Mapbox establecido');
          resolve();
        };
        script.onerror = () => {
          console.error('Error cargando script de Mapbox GL');
          resolve(); // Resolver aunque falle para no bloquear
        };
        document.head.appendChild(script);
      }
    });
  }

  private addMarkers() {
    if (!this.order?.address?.coordinates || !this.map) return;

    console.log('Añadiendo marcadores al mapa...');

    const customerLng = this.getCoordinateLng(this.order.address.coordinates);
    const customerLat = this.getCoordinateLat(this.order.address.coordinates);

    // Marcador del cliente (destino)
    const customerMarkerEl = document.createElement('div');
    customerMarkerEl.className = 'marker marker-customer';
    customerMarkerEl.innerHTML = '📍';

    new this.mapboxgl.Marker(customerMarkerEl)
      .setLngLat([customerLng, customerLat])
      .setPopup(
        new this.mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="popup"><strong>Destino</strong><br>${this.deliveryAddress}</div>`
        )
      )
      .addTo(this.map);

    // Marcador de ubicación actual del delivery
    if (this.currentLocation) {
      const deliveryMarkerEl = document.createElement('div');
      deliveryMarkerEl.className = 'marker marker-delivery';
      deliveryMarkerEl.innerHTML = '🚗';

      new this.mapboxgl.Marker(deliveryMarkerEl)
        .setLngLat([this.currentLocation.lng, this.currentLocation.lat])
        .setPopup(
          new this.mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="popup"><strong>Tu ubicación</strong></div>'
          )
        )
        .addTo(this.map);
    }

    // Ajustar vista para mostrar ambos puntos
    this.fitMapToMarkers();

    // Dibujar ruta si es posible
    if (this.currentLocation) {
      this.drawRoute(
        this.currentLocation.lng,
        this.currentLocation.lat,
        customerLng,
        customerLat
      );
    }

    // Forzar redimensión del mapa para asegurar que se renderice correctamente
    setTimeout(() => {
      if (this.map) {
        console.log('Forzando resize del mapa');
        this.map.resize();
      }
    }, 100);
  }

  private drawRoute(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number
  ) {
    if (!this.map) return;

    this.mapboxRoutingService
      .getRoute([startLng, startLat], [endLng, endLat])
      .subscribe({
        next: (response) => {
          if (response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            const coordinates = route.geometry.coordinates;

            // Añadir fuente y capa de ruta
            if (this.map.getSource('route')) {
              this.map.getSource('route').setData({
                type: 'Feature',
                geometry: route.geometry,
              });
            } else {
              this.map.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  geometry: route.geometry,
                },
              });

              this.map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#0066cc',
                  'line-width': 4,
                  'line-opacity': 0.8,
                },
              });
            }
          }
        },
        error: () => {
          console.log('Error dibujando ruta, mostrando línea directa');
          this.drawDirectLine(startLng, startLat, endLng, endLat);
        },
      });
  }

  private drawDirectLine(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number
  ) {
    if (!this.map) return;

    if (this.map.getSource('directLine')) {
      this.map.getSource('directLine').setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [startLng, startLat],
            [endLng, endLat],
          ],
        },
      });
    } else {
      this.map.addSource('directLine', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [startLng, startLat],
              [endLng, endLat],
            ],
          },
        },
      });

      this.map.addLayer({
        id: 'directLine',
        type: 'line',
        source: 'directLine',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff9900',
          'line-width': 3,
          'line-dasharray': [4, 4],
          'line-opacity': 0.6,
        },
      });
    }
  }

  private fitMapToMarkers() {
    if (!this.map || !this.order?.address?.coordinates || !this.currentLocation)
      return;

    const bounds = new this.mapboxgl.LngLatBounds();
    bounds.extend([this.currentLocation.lng, this.currentLocation.lat]);
    bounds.extend([
      this.getCoordinateLng(this.order.address.coordinates),
      this.getCoordinateLat(this.order.address.coordinates),
    ]);

    this.map.fitBounds(bounds, { padding: 50 });
  }

  private async calculateDistance() {
    if (!this.currentLocation || !this.order?.address?.coordinates) return;

    const customerLng = this.getCoordinateLng(this.order.address.coordinates);
    const customerLat = this.getCoordinateLat(this.order.address.coordinates);

    this.mapboxRoutingService
      .getDistanceAndETA([this.currentLocation.lng, this.currentLocation.lat], [
        customerLng,
        customerLat,
      ])
      .subscribe({
        next: (result) => {
          this.distance = result.distance;
          this.estimatedTime = result.duration;
        },
        error: () => {
          // Fallback a cálculo rápido
          const quickDistance = this.mapboxRoutingService.calculateHaversineDistance(
            [this.currentLocation!.lng, this.currentLocation!.lat],
            [customerLng, customerLat]
          );
          this.distance = quickDistance;
          this.estimatedTime = Math.ceil(quickDistance * 2.5); // Estimación aproximada
        },
      });
  }

  async acceptOrder() {
    if (!this.order?.id || !this.currentUserId) {
      this.showError('No se puede aceptar el pedido');
      return;
    }

    this.isAccepting = true;

    try {
      const db = getFirestore();
      const orderRef = doc(db, 'pedidos', this.order.id);

      await updateDoc(orderRef, {
        status: 'en camino',
        'deliveryPerson.uid': this.currentUserId,
        acceptedAt: new Date(),
      });

      const toast = await this.toastCtrl.create({
        message: '✅ Pedido aceptado correctamente',
        duration: 2000,
        color: 'success',
      });
      await toast.present();

      // Navegar a tracking
      setTimeout(() => {
        this.router.navigate(['/delivery-order-tracking', this.order!.id]);
      }, 500);
    } catch (error) {
      console.error('Error aceptando pedido:', error);
      this.showError('Error al aceptar el pedido');
    } finally {
      this.isAccepting = false;
    }
  }

  cancelPreview() {
    this.router.navigate(['/delivery-pedidos']);
  }

  openNavigation() {
    if (!this.order?.address?.coordinates) return;

    const lat = this.getCoordinateLat(this.order.address.coordinates);
    const lng = this.getCoordinateLng(this.order.address.coordinates);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  private getAddressString(): string {
    if (!this.order?.address) return '';
    let address = this.order.address.street || '';
    if (this.order.address.details) {
      address += ` (${this.order.address.details})`;
    }
    return address;
  }

  private getCoordinateLat(coords: any): number {
    if (Array.isArray(coords)) {
      return coords[1];
    }
    return coords.lat;
  }

  private getCoordinateLng(coords: any): number {
    if (Array.isArray(coords)) {
      return coords[0];
    }
    return coords.lng;
  }

  private showError(message: string) {
    this.alertCtrl
      .create({
        header: 'Error',
        message,
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/delivery-pedidos']);
            },
          },
        ],
      })
      .then((alert) => alert.present());
  }
}
