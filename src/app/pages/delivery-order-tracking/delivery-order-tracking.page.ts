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
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Order } from '../../models/orden.model';
import { TrackingService, LocationUpdate } from '../../services/tracking.service';
import { MapboxRoutingService } from '../../services/mapbox-routing.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  locationOutline,
  timeOutline,
  checkmarkDoneOutline,
  navigate,
} from 'ionicons/icons';

@Component({
  selector: 'app-delivery-order-tracking',
  templateUrl: './delivery-order-tracking.page.html',
  styleUrls: ['./delivery-order-tracking.page.scss'],
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
    IonFab,
    IonFabButton,
  ],
})
export class DeliveryOrderTrackingPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  orderId: string = '';
  order: Order | null = null;
  currentLocation: LocationUpdate | null = null;
  distance: number | null = null;
  estimatedTime: number | null = null;
  isLoading = true;
  isTracking = false;

  private map: any = null;
  private myMarker: any = null;
  private customerMarker: any = null;
  private restaurantMarker: any = null;
  private routeSource: any = null;
  private unsubscribeOrder?: () => void;
  private mapScript: boolean = false;
  private mapboxgl: any;
  private locationWatchId: any;

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
      checkmarkDoneOutline,
      navigate,
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
    if (this.map) this.map.remove();
    this.stopTracking();
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

          // Inicializar mapa
          if (!this.mapScript && this.order) {
            setTimeout(() => this.initMap(), 500);
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
   * Iniciar tracking de ubicación
   */
  async startTracking() {
    this.isTracking = true;
    try {
      await this.trackingService.startDeliveryTracking(this.orderId);
      // Escuchar cambios en tu ubicación
      this.listenToMyLocation();
    } catch (error) {
      console.error('Error starting tracking:', error);
      this.isTracking = false;
    }
  }

  /**
   * Detener tracking
   */
  stopTracking() {
    this.isTracking = false;
    this.trackingService.stopDeliveryTracking();
    if (this.locationWatchId) {
      clearInterval(this.locationWatchId);
    }
  }

  /**
   * Escuchar cambios en mi ubicación
   */
  private listenToMyLocation() {
    this.trackingService.getCurrentLocation().subscribe((location) => {
      if (location) {
        this.currentLocation = location;
        this.updateMyMarker();
        this.calculateDistance();
        this.drawRoute();
      }
    });
  }

  /**
   * Marcar pedido como entregado
   */
  async markAsDelivered() {
    if (!this.order?.id) return;

    const db = getFirestore();
    const orderRef = doc(db, 'pedidos', this.order.id);

    try {
      await updateDoc(orderRef, {
        status: 'entregado',
        deliveredAt: new Date(),
      });

      await this.showAlert('Éxito', 'Pedido marcado como entregado');
      this.router.navigate(['/delivery-pedidos']);
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      await this.showAlert('Error', 'No se pudo marcar como entregado');
    }
  }

  /**
   * Inicializar mapa
   */
  private initMap() {
    if (this.mapScript || !this.order?.address?.coordinates) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => this.createMap();
    document.head.appendChild(script);

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

    this.map = new this.mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [customerLng, customerLat],
      zoom: 14,
    });

    this.map.on('load', () => {
      this.setupMap();
    });
  }

  /**
   * Configurar el mapa con fuentes y capas
   */
  private setupMap() {
    if (!this.map) return;

    // Source para la ruta
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

    // Layer para la ruta
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
        'line-width': 5
      }
    });

    // Agregar marcadores iniciales
    this.addInitialMarkers();
  }

  /**
   * Agregar marcadores iniciales
   */
  private addInitialMarkers() {
    if (!this.order?.address?.coordinates) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    // Marcador del cliente/destino
    const customerMarkerEl = document.createElement('div');
    customerMarkerEl.innerHTML = '📍';
    customerMarkerEl.style.fontSize = '32px';

    this.customerMarker = new this.mapboxgl.Marker(customerMarkerEl)
      .setLngLat([customerLng, customerLat])
      .setPopup(new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div><strong>Destino de Entrega</strong><br>${this.order.address?.street || 'Ubicación'}</div>`))
      .addTo(this.map);
  }

  /**
   * Actualizar mi marcador
   */
  private updateMyMarker() {
    if (!this.map || !this.currentLocation) return;

    const markerEl = document.createElement('div');
    markerEl.innerHTML = '🚗';
    markerEl.style.fontSize = '32px';
    markerEl.className = 'my-location-marker';

    if (this.myMarker) {
      this.myMarker.setLngLat([this.currentLocation.lng, this.currentLocation.lat]);
    } else {
      this.myMarker = new this.mapboxgl.Marker(markerEl)
        .setLngLat([this.currentLocation.lng, this.currentLocation.lat])
        .setPopup(new this.mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div><strong>Tu Ubicación</strong></div>`))
        .addTo(this.map);
    }

    // Auto-centrar el mapa en tu ubicación
    this.map.easeTo({
      center: [this.currentLocation.lng, this.currentLocation.lat],
      zoom: 15
    });
  }

  /**
   * Dibujar ruta hacia el destino
   */
  private drawRoute() {
    if (!this.order?.address?.coordinates || !this.currentLocation) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    this.mapboxRoutingService
      .getRoute([this.currentLocation.lng, this.currentLocation.lat], [customerLng, customerLat])
      .subscribe(
        (response) => {
          if (response.routes && response.routes.length > 0 && this.map) {
            const route = response.routes[0];
            if (this.map.getSource('route')) {
              this.map.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              });
            }
          }
        },
        (error) => {
          console.warn('Error getting route:', error);
          // Dibujar línea recta
          if (this.map && this.map.getSource('route')) {
            this.map.getSource('route').setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [this.currentLocation!.lng, this.currentLocation!.lat],
                  [customerLng, customerLat]
                ]
              }
            });
          }
        }
      );
  }

  /**
   * Calcular distancia al destino
   */
  private calculateDistance() {
    if (!this.currentLocation || !this.order?.address?.coordinates) return;

    const customerLat = this.getCoordinateLat(this.order.address.coordinates);
    const customerLng = this.getCoordinateLng(this.order.address.coordinates);

    this.mapboxRoutingService
      .getDistanceAndETA([this.currentLocation.lng, this.currentLocation.lat], [customerLng, customerLat])
      .subscribe(
        (result) => {
          this.distance = result.distance;
          this.estimatedTime = result.duration;
        },
        (error) => {
          this.distance = this.trackingService.calculateDistance(
            this.currentLocation!.lat,
            this.currentLocation!.lng,
            customerLat,
            customerLng
          );
          this.estimatedTime = this.trackingService.estimateDeliveryTime(this.distance);
        }
      );
  }

  /**
   * Abrir navegador externo
   */
  openNavigation() {
    if (!this.order?.address?.coordinates) return;

    const lat = this.getCoordinateLat(this.order.address.coordinates);
    const lng = this.getCoordinateLng(this.order.address.coordinates);

    // Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  /**
   * Volver atrás
   */
  cerrar() {
    this.router.navigate(['/delivery-pedidos']);
  }

  private async showAlert(header: string, message: string) {
    // Implementar alerta simple
    alert(`${header}: ${message}`);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pendiente': return 'hourglass-outline';
      case 'en camino': return 'navigate';
      case 'entregado': return 'checkmark-done-outline';
      default: return 'help-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pendiente': return 'warning';
      case 'en camino': return 'primary';
      case 'entregado': return 'success';
      default: return 'medium';
    }
  }
}
