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
  private unsubscribeOrder?: () => void;
  private unsubscribeLocation?: () => void;
  private mapScript: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackingService: TrackingService
  ) {
    addIcons({
      mapOutline,
      locationOutline,
      timeOutline,
      personOutline,
      callOutline,
    });
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

    const mapboxgl = (window as any).mapboxgl;

    // Nota: Debes reemplazar esto con tu token real de Mapbox
    const mapboxToken =
      'pk.eyJ1IjoiaG9sYTIzMTM0MSIsImEiOiJjbWlmNWx0azkwMjl5M3BwdTYxdDhtNHBmIn0.UX1wDxJ8Bah1BP-OUJAP8Q'; // Reemplaza con tu token

    mapboxgl.accessToken = mapboxToken;

    const customerLat = this.order.address.coordinates.lat;
    const customerLng = this.order.address.coordinates.lng;
    const centerLat =
      (customerLat + (this.deliveryLocation?.lat || customerLat)) / 2;
    const centerLng =
      (customerLng + (this.deliveryLocation?.lng || customerLng)) / 2;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 14,
    });

    // Agregar marcadores después de que el mapa cargue
    this.map.on('load', () => {
      this.addMarkers();
    });
  }

  /**
   * Agregar marcadores al mapa
   */
  private addMarkers() {
    if (!this.map || !this.order) return;

    const mapboxgl = (window as any).mapboxgl;

    // Marcador de cliente
    if (this.order.address?.coordinates) {
      const customerMarkerEl = document.createElement('div');
      customerMarkerEl.className = 'marker customer-marker';
      customerMarkerEl.innerHTML =
        '📍 <span style="color: #FF6B6B; font-weight: bold;">Cliente</span>';

      this.customerMarker = new mapboxgl.Marker(customerMarkerEl)
        .setLngLat([
          this.order.address.coordinates.lng,
          this.order.address.coordinates.lat,
        ])
        .addTo(this.map);
    }

    // Marcador de delivery
    if (this.deliveryLocation) {
      const deliveryMarkerEl = document.createElement('div');
      deliveryMarkerEl.className = 'marker delivery-marker';
      deliveryMarkerEl.innerHTML =
        '🚗 <span style="color: #4CAF50; font-weight: bold;">Delivery</span>';

      this.deliveryMarker = new mapboxgl.Marker(deliveryMarkerEl)
        .setLngLat([this.deliveryLocation.lng, this.deliveryLocation.lat])
        .addTo(this.map);
    }
  }

  /**
   * Actualizar marcadores en el mapa
   */
  private updateMapMarkers() {
    if (!this.map || !this.deliveryLocation) return;

    const mapboxgl = (window as any).mapboxgl;

    // Actualizar marcador de delivery
    if (this.deliveryMarker) {
      this.deliveryMarker.setLngLat([
        this.deliveryLocation.lng,
        this.deliveryLocation.lat,
      ]);
    } else {
      const deliveryMarkerEl = document.createElement('div');
      deliveryMarkerEl.className = 'marker delivery-marker';
      deliveryMarkerEl.innerHTML =
        '🚗 <span style="color: #4CAF50;">Delivery</span>';

      this.deliveryMarker = new mapboxgl.Marker(deliveryMarkerEl)
        .setLngLat([this.deliveryLocation.lng, this.deliveryLocation.lat])
        .addTo(this.map);
    }

    // Ajustar zoom para mostrar ambos marcadores
    this.fitMapToMarkers();
  }

  /**
   * Ajustar zoom del mapa para mostrar ambos marcadores
   */
  private fitMapToMarkers() {
    if (!this.map || !this.order?.address?.coordinates || !this.deliveryLocation)
      return;

    const bounds = new (window as any).mapboxgl.LngLatBounds();
    bounds.extend([
      this.order.address.coordinates.lng,
      this.order.address.coordinates.lat,
    ]);
    bounds.extend([this.deliveryLocation.lng, this.deliveryLocation.lat]);

    this.map.fitBounds(bounds, { padding: 50 });
  }

  /**
   * Calcular distancia
   */
  private calculateDistance() {
    if (!this.deliveryLocation || !this.order?.address?.coordinates) return;

    this.distance = this.trackingService.calculateDistance(
      this.deliveryLocation.lat,
      this.deliveryLocation.lng,
      this.order.address.coordinates.lat,
      this.order.address.coordinates.lng
    );

    this.estimatedTime = this.trackingService.estimateDeliveryTime(
      this.distance
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
