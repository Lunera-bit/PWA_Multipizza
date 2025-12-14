import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonCardHeader, IonList, IonItem, IonLabel, IonIcon, IonBackButton, AlertController, ModalController, ToastController, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { getFirestore, doc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { TrackingService, LocationUpdate } from '../../services/tracking.service';
import { MapboxRoutingService } from '../../services/mapbox-routing.service';

@Component({
  selector: 'app-detallepedido',
  templateUrl: './detallepedido.component.html',
  styleUrls: ['./detallepedido.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonBackButton, IonIcon, IonBadge, IonSpinner]
})
export class DetallepedidoComponent implements OnInit, OnDestroy {
  @Input() pedido: any;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('mapContainer') mapContainer?: ElementRef;

  private map?: any;
  private mapboxgl: any;
  showMap = false;
  isLoadingMap = false;
  deliveryLocation: LocationUpdate | null = null;
  distance: number | null = null;
  estimatedTime: number | null = null;
  private unsubscribeLocation?: Unsubscribe;

  // Mapeo de tamaños
  private sizes = [
    { id: 'personal', label: 'Personal - S' },
    { id: 'mediana', label: 'Mediana - M' },
    { id: 'grande', label: 'Grande - L' },
    { id: 'familiar', label: 'Familiar - XL' }
  ];

  constructor(
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private trackingService: TrackingService,
    private mapboxRoutingService: MapboxRoutingService
  ) {
    // Token configurado en environment
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.unsubscribeLocation) {
      this.unsubscribeLocation();
    }
    if (this.map) {
      this.map.remove();
    }
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

  /**
   * Mostrar mapa de tracking
   */
  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap && this.pedido.status === 'en camino') {
      setTimeout(() => this.initTrackingMap(), 300);
    }
  }

  /**
   * Inicializar mapa de tracking
   */
  private initTrackingMap() {
    if (this.isLoadingMap || !this.mapContainer || !this.pedido.address?.coordinates) return;

    this.isLoadingMap = true;

    // Cargar script de Mapbox
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      this.createTrackingMap();
    };
    document.head.appendChild(script);

    // Cargar CSS de Mapbox
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  /**
   * Crear mapa de tracking
   */
  private createTrackingMap() {
    if (!this.mapContainer) return;

    this.mapboxgl = (window as any).mapboxgl;
    this.mapboxgl.accessToken = environment.mapboxToken;

    const customerLat = this.getCoordinateLat(this.pedido.address.coordinates);
    const customerLng = this.getCoordinateLng(this.pedido.address.coordinates);

    this.map = new this.mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [customerLng, customerLat],
      zoom: 15,
    });

    this.map.on('load', () => {
      this.setupTrackingMap();
    });
  }

  /**
   * Configurar mapa de tracking con ruta
   */
  private setupTrackingMap() {
    if (!this.map || !this.pedido.address?.coordinates) return;

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
        'line-width': 4
      }
    });

    // Marcador del cliente
    const customerMarkerEl = document.createElement('div');
    customerMarkerEl.innerHTML = '📍';
    customerMarkerEl.style.fontSize = '24px';

    const customerLat = this.getCoordinateLat(this.pedido.address.coordinates);
    const customerLng = this.getCoordinateLng(this.pedido.address.coordinates);

    new this.mapboxgl.Marker(customerMarkerEl)
      .setLngLat([customerLng, customerLat])
      .setPopup(new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div><strong>Tu Ubicación</strong><br>${this.pedido.address?.street || 'Ubicación de entrega'}</div>`))
      .addTo(this.map);

    this.isLoadingMap = false;

    // Empezar a escuchar ubicación del delivery
    if (this.pedido.id && this.pedido.status === 'en camino') {
      this.startListeningToDeliveryLocation();
    }
  }

  /**
   * Escuchar ubicación del delivery
   */
  private startListeningToDeliveryLocation() {
    if (!this.pedido.id) return;

    this.unsubscribeLocation = this.trackingService.listenToDeliveryLocation(
      this.pedido.id,
      (location) => {
        if (location && this.pedido?.address?.coordinates) {
          this.deliveryLocation = location;
          this.updateDeliveryMarker();
          this.calculateDistanceToDelivery();
          this.drawRoute();
        }
      }
    );
  }

  /**
   * Actualizar marcador del delivery
   */
  private updateDeliveryMarker() {
    if (!this.map || !this.deliveryLocation) return;

    // Remover marcador anterior si existe
    const existingMarkers = document.querySelectorAll('.delivery-marker-detail');
    existingMarkers.forEach(el => el.remove());

    const deliveryMarkerEl = document.createElement('div');
    deliveryMarkerEl.className = 'delivery-marker-detail';
    deliveryMarkerEl.innerHTML = '🚗';
    deliveryMarkerEl.style.fontSize = '24px';

    new this.mapboxgl.Marker(deliveryMarkerEl)
      .setLngLat([this.deliveryLocation.lng, this.deliveryLocation.lat])
      .setPopup(new this.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div><strong>Repartidor</strong><br>En ruta hacia tu ubicación</div>`))
      .addTo(this.map);
  }

  /**
   * Dibujar ruta
   */
  private drawRoute() {
    if (!this.map || !this.deliveryLocation || !this.pedido.address?.coordinates) return;

    const customerLat = this.getCoordinateLat(this.pedido.address.coordinates);
    const customerLng = this.getCoordinateLng(this.pedido.address.coordinates);

    this.mapboxRoutingService
      .getRoute([this.deliveryLocation.lng, this.deliveryLocation.lat], [customerLng, customerLat])
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
          // Dibujar línea recta como fallback
          if (this.map && this.map.getSource('route')) {
            this.map.getSource('route').setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [this.deliveryLocation!.lng, this.deliveryLocation!.lat],
                  [customerLng, customerLat]
                ]
              }
            });
          }
        }
      );
  }

  /**
   * Calcular distancia hasta delivery
   */
  private calculateDistanceToDelivery() {
    if (!this.deliveryLocation || !this.pedido.address?.coordinates) return;

    const customerLat = this.getCoordinateLat(this.pedido.address.coordinates);
    const customerLng = this.getCoordinateLng(this.pedido.address.coordinates);

    // Intentar obtener distancia exacta de Mapbox
    this.mapboxRoutingService
      .getDistanceAndETA([this.deliveryLocation.lng, this.deliveryLocation.lat], [customerLng, customerLat])
      .subscribe(
        (result) => {
          this.distance = result.distance;
          this.estimatedTime = result.duration;
        },
        (error) => {
          console.warn('Error getting distance:', error);
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

  getSizeLabel(sizeId: string): string {
    const size = this.sizes.find(s => s.id === sizeId);
    return size?.label || sizeId || '';
  }

  calcularSubtotal(): number {
    return this.pedido.items?.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0) || 0;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      entregado: 'Entregado',
      'en camino': 'En camino'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pendiente': return 'status-pendiente';
      case 'en camino': return 'status-en-camino';
      case 'entregado': return 'status-entregado';
      case 'cancelado': return 'status-cancelado';
      default: return 'status-pendiente';
    }
  }

  formatDate(ts: any): string {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '—';
    }
  }

  async cancelarPedido() {
    const alert = await this.alertCtrl.create({
      header: '¿Cancelar pedido?',
      message: '¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'No, mantener',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Sí, cancelar',
          cssClass: 'alert-danger',
          handler: async () => {
            try {
              const db = getFirestore();
              const pedidoRef = doc(db, 'pedidos', this.pedido.id);
              await updateDoc(pedidoRef, { status: 'cancelado' });

              await this.showToast('Pedido cancelado exitosamente');
              await this.modalCtrl.dismiss({ cancelled: true });
            } catch (err) {
              console.error('Error cancelando pedido:', err);
              await this.showToast('Error al cancelar el pedido');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
