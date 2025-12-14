import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonBadge,
  IonSpinner,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { Order } from '../../models/orden.model';
import { TrackingService, LocationUpdate } from '../../services/tracking.service';
import { MapboxRoutingService } from '../../services/mapbox-routing.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  locationOutline,
  timeOutline,
  personOutline,
  callOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.page.html',
  styleUrls: ['./order-tracking.page.scss'],
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
    IonBadge,
    IonSpinner,
    IonIcon,
    IonText,
  ],
})
export class OrderTrackingPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  orderId: string = '';
  order: Order | null = null;
  deliveryLocation: LocationUpdate | null = null;
  distance: number | null = null;
  estimatedTime: number | null = null;
  isLoading = true;

  private map: any = null;
  private deliveryMarker: any = null;
  private customerMarker: any = null;
  private routeSource: any = null;
  private unsubscribeOrder?: () => void;
  private unsubscribeLocation?: () => void;
  private mapScript: boolean = false;
  private mapboxgl: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackingService: TrackingService,
    private mapboxRoutingService: MapboxRoutingService
  ) {
    addIcons({
      mapOutline,
      locationOutline,
      timeOutline,
      personOutline,
      callOutline,
    });
  }

  /**
   * Obtener latitud de coordenadas (soporta ambos formatos)
   */
  private getCoordinateLat(coords: any): number {
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      return coords.lat;
    }
    return coords[1];
  }

  /**
   * Obtener longitud de coordenadas (soporta ambos formatos)
   */
  private getCoordinateLng(coords: any): number {
    if (typeof coords === 'object' && !Array.isArray(coords)) {
      return coords.lng;
    }
    return coords[0];
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.orderId = params['orderId'];
      this.loadOrder();
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeOrder) this.unsubscribeOrder();
    if (this.unsubscribeLocation) this.unsubscribeLocation();
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Cargar información de la orden
   */
  private loadOrder() {
    const db = getFirestore();
    const orderRef = doc(db, 'pedidos', this.orderId);

    this.unsubscribeOrder = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          this.order = { id: snapshot.id, ...snapshot.data() } as Order;
          this.isLoading = false;

          // Si el mapa no está inicializado, hacerlo
          if (!this.mapScript && this.order) {
            setTimeout(() => this.initMap(), 500);
          }

          // Escuchar cambios en ubicación del delivery
          if (
            this.order.deliveryPerson &&
            !this.unsubscribeLocation
          ) {
            this.startListeningToDeliveryLocation();
          }
        }
      },
      (error) => {
        console.error('Error loading order:', error);
        this.isLoading = false;
      }
    );
  }

  /**
   * Escuchar cambios de ubicación del delivery
   */
  private startListeningToDeliveryLocation() {
    if (!this.orderId) return;

    this.unsubscribeLocation = this.trackingService.listenToDeliveryLocation(
      this.orderId,
      (location) => {
        if (location && this.order?.address?.coordinates) {
          this.deliveryLocation = location;
          this.calculateDistance();
          this.updateMapMarkers();
        }
      }
    );
  }

  /**
   * Inicializar mapa con Mapbox
   */
  private initMap() {
    if (this.mapScript || !this.order?.address?.coordinates) return;

    // Cargar script de Mapbox
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      this.createMap();
    };
    document.head.appendChild(script);

    // Cargar CSS de Mapbox
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    this.mapScript = true;
  }

  /**
   * Crear instancia del mapa
   */
  private createMap() {
    if (!this.mapContainer || !this.order?.address?.coordinates) return;

    this.mapboxgl = (window as any).mapboxgl;
    this.mapboxgl.accessToken = environment.mapboxToken;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);
    const centerLat =
      (customerLat + (this.deliveryLocation?.lat || customerLat)) / 2;
    const centerLng =
      (customerLng + (this.deliveryLocation?.lng || customerLng)) / 2;

    this.map = new this.mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 14,
    });

    // Agregar marcadores y ruta después de que el mapa cargue
    this.map.on('load', () => {
      this.addMarkersAndRoute();
    });
  }

  /**
   * Agregar marcadores y ruta al mapa
   */
  private addMarkersAndRoute() {
    if (!this.map || !this.order?.address?.coordinates) return;

    // Agregar source y layer para la ruta
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    this.map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });

    // Marcador de cliente
    const customerMarkerEl = document.createElement('div');
    customerMarkerEl.className = 'marker customer-marker';
    customerMarkerEl.innerHTML = '📍';
    customerMarkerEl.style.width = '32px';
    customerMarkerEl.style.height = '32px';
    customerMarkerEl.style.backgroundSize = 'contain';

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    this.customerMarker = new this.mapboxgl.Marker(customerMarkerEl, { color: '#FF6B6B' })
      .setLngLat([customerLng, customerLat])
      .setPopup(new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div><strong>Entrega</strong><br>${this.order.address?.street || 'Dirección'}</div>`))
      .addTo(this.map);

    // Marcador de delivery si existe ubicación
    if (this.deliveryLocation) {
      this.addDeliveryMarker();
      this.drawRoute();
    }
  }

  /**
   * Agregar marcador de delivery
   */
  private addDeliveryMarker() {
    if (!this.map || !this.deliveryLocation) return;

    const deliveryMarkerEl = document.createElement('div');
    deliveryMarkerEl.className = 'marker delivery-marker';
    deliveryMarkerEl.innerHTML = '🚗';
    deliveryMarkerEl.style.width = '32px';
    deliveryMarkerEl.style.height = '32px';
    deliveryMarkerEl.style.backgroundSize = 'contain';

    if (this.deliveryMarker) {
      this.deliveryMarker.remove();
    }

    this.deliveryMarker = new this.mapboxgl.Marker(deliveryMarkerEl, { color: '#4CAF50' })
      .setLngLat([this.deliveryLocation.lng, this.deliveryLocation.lat])
      .setPopup(new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div><strong>Repartidor</strong><br>${this.order?.deliveryPerson?.displayName || 'En ruta'}</div>`))
      .addTo(this.map);
  }

  /**
   * Dibujar ruta usando Mapbox Directions API
   */
  private drawRoute() {
    if (!this.order?.address?.coordinates || !this.deliveryLocation) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    this.mapboxRoutingService
      .getRoute([this.deliveryLocation.lng, this.deliveryLocation.lat], [customerLng, customerLat])
      .subscribe(
        (response) => {
          if (response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            if (this.map && this.map.getSource('route')) {
              this.map.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              });
            }
            this.fitMapToMarkers();
          }
        },
        (error) => {
          console.error('Error getting route:', error);
          // Si hay error, usar aproximación con línea recta
          this.drawDirectLine();
        }
      );
  }

  /**
   * Dibujar línea recta como fallback
   */
  private drawDirectLine() {
    if (!this.order?.address?.coordinates || !this.deliveryLocation) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    if (this.map && this.map.getSource('route')) {
      this.map.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [this.deliveryLocation.lng, this.deliveryLocation.lat],
            [customerLng, customerLat]
          ]
        }
      });
    }
    this.fitMapToMarkers();
  }

  /**
   * Ajustar zoom del mapa para mostrar ambos marcadores
   */
  private fitMapToMarkers() {
    if (!this.map || !this.order?.address?.coordinates || !this.deliveryLocation) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    const bounds = new this.mapboxgl.LngLatBounds();
    bounds.extend([customerLng, customerLat]);
    bounds.extend([this.deliveryLocation.lng, this.deliveryLocation.lat]);

    this.map.fitBounds(bounds, { padding: 50 });
  }

  /**
   * Actualizar marcadores en el mapa
   */
  private updateMapMarkers() {
    if (!this.map || !this.deliveryLocation) return;

    this.addDeliveryMarker();
    this.drawRoute();
  }

  /**
   * Calcular distancia
   */
  private calculateDistance() {
    if (!this.deliveryLocation || !this.order?.address?.coordinates) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    // Usar Mapbox para distancia más precisa si es posible
    this.mapboxRoutingService
      .getDistanceAndETA([this.deliveryLocation.lng, this.deliveryLocation.lat], [customerLng, customerLat])
      .subscribe(
        (result) => {
          this.distance = result.distance;
          this.estimatedTime = result.duration;
        },
        (error) => {
          console.warn('Could not get route ETA, using estimate:', error);
          // Fallback a cálculo rápido
          this.distance = this.trackingService.calculateDistance(
            this.deliveryLocation!.lat,
            this.deliveryLocation!.lng,
            customerLat,
            customerLng
          );
          this.estimatedTime = this.trackingService.estimateDeliveryTime(this.distance);
        }
      );
  }

  /**
   * Llamar al delivery
   */
  callDelivery() {
    if (this.order?.deliveryPerson?.phone) {
      window.location.href = `tel:${this.order.deliveryPerson.phone}`;
    }
  }

  /**
   * Obtener estado con ícono
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'hourglass-outline';
      case 'en camino':
        return 'car-outline';
      case 'entregado':
        return 'checkmark-done-outline';
      case 'cancelado':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  }

  /**
   * Obtener color de estado
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'warning';
      case 'en camino':
        return 'primary';
      case 'entregado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'medium';
    }
  }
}
