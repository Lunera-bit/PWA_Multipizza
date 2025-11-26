import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonList, IonItem, IonLabel, IonText, IonInput, IonTextarea, IonIcon } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, pin, home, search } from 'ionicons/icons';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../environments/environment';

// Reemplaza con tu token de Mapbox
// const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHp1eHhhIn0.xxxxx'; // CAMBIA ESTO

@Component({
  selector: 'app-clientroute',
  templateUrl: './clientroute.page.html',
  styleUrls: ['./clientroute.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonList, IonItem, IonLabel, IonText, IonInput, IonTextarea, IonIcon, CommonModule, FormsModule]
})
export class ClientroutePage implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  items: CartItem[] = [];
  total = 0;
  private sub?: Subscription;

  currentStep = 1;

  userName = '';
  userEmail = '';
  userPhone = '';

  instructions = '';

  address = '';
  addressDetails = '';

  latitude?: number;
  longitude?: number;

  private map?: mapboxgl.Map;
  private marker?: mapboxgl.Marker;
  private geocoder?: InstanceType<typeof MapboxGeocoder>;

  constructor(
    private cart: CartService,
    private toastCtrl: ToastController
  ) {
    addIcons({ arrowBack, arrowForward, pin, home, search });
    mapboxgl.accessToken = environment.mapboxToken;
  }

  ngOnInit() {
    this.sub = this.cart.cart$.subscribe(items => {
      this.items = items || [];
      this.recalc();
    });

    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      this.userName = user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario');
      this.userEmail = user.email || '';
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.map?.remove();
  }

  private recalc() {
    this.total = this.items.reduce((s, it) => s + ((it.price || 0) * (it.qty || 0)), 0);
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      this.currentStep++;
      // Inicializa el mapa cuando llega al paso 4
      if (this.currentStep === 4) {
        setTimeout(() => this.initMap(), 500);
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!this.items || this.items.length === 0) {
          this.showToast('El carrito está vacío.');
          return false;
        }
        return true;
      case 2:
        if (!this.userName.trim() || !this.userEmail.trim() || !this.userPhone.trim()) {
          this.showToast('Por favor completa todos los datos.');
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        if (!this.address.trim()) {
          this.showToast('Por favor ingresa una dirección.');
          return false;
        }
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  }

  private initMap() {
    if (this.map) return;

    const container = this.mapContainer?.nativeElement;
    if (!container) {
      console.error('Map container no encontrado');
      return;
    }

    // Coordenadas de Lima, Perú
    const limaCoords: LngLatLike = [-77.0428, -12.0464];
    const defaultCoords: LngLatLike = this.latitude && this.longitude 
      ? [this.longitude, this.latitude] 
      : limaCoords;

    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/hola231341/cmif5i96h00if01qmchq96rxm',
      center: defaultCoords,
      zoom: 13
    });

    // agregar control de geolocalización
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-left');

    // agregar geocoder (búsqueda SOLO PERÚ)
    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl,
      language: 'es',
      country: 'pe', // SOLO PERÚ
      proximity: limaCoords, // Prioriza resultados cerca de Lima
      bbox: [-81.327, -18.361, -68.665, -0.443] // Bounding box de Perú
    });

    this.map.addControl(this.geocoder, 'top-right');

    // listener para clicks en el mapa
    this.map.on('click', (e) => {
      this.setMarker(e.lngLat.lng, e.lngLat.lat);
    });

    // listener para búsqueda del geocoder
    this.geocoder.on('result', (e: any) => {
      const coords = e.result.geometry.coordinates;
      this.setMarker(coords[0], coords[1]);
      this.address = e.result.place_name || '';
    });

    // agregar marcador inicial si existe ubicación
    if (this.latitude && this.longitude) {
      this.setMarker(this.longitude, this.latitude);
    }
  }

  private setMarker(lng: number, lat: number) {
    if (this.marker) {
      this.marker.remove();
    }

    this.latitude = lat;
    this.longitude = lng;

    this.marker = new mapboxgl.Marker({ color: '#3880ff' })
      .setLngLat([lng, lat])
      .addTo(this.map!);

    // centra el mapa en el marcador
    this.map?.flyTo({
      center: [lng, lat],
      zoom: 15
    });
  }

  async placeOrder() {
    if (!this.validateStep(5)) {
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      const order = {
        user: {
          uid: user?.uid || null,
          name: this.userName,
          email: this.userEmail,
          phone: this.userPhone
        },
        items: this.items.map(i => ({ id: i.id, name: i.title, price: i.price, qty: i.qty, type: i.type })),
        instructions: this.instructions,
        address: {
          street: this.address,
          details: this.addressDetails,
          coordinates: this.latitude && this.longitude ? { lat: this.latitude, lng: this.longitude } : null
        },
        total: this.total,
        status: 'pendiente',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'pedidos'), order);

      this.items.forEach(it => {
        this.cart.setItemQty(it.id, it.type, 0);
      });

      await this.showToast('Pedido generado correctamente.');
      this.resetForm();
    } catch (err) {
      console.error('Error creando pedido:', err);
      await this.showToast('Error al generar pedido.');
    }
  }

  private resetForm() {
    this.currentStep = 1;
    this.instructions = '';
    this.address = '';
    this.addressDetails = '';
    this.latitude = undefined;
    this.longitude = undefined;
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom' });
    await t.present();
  }

  setLocation() {
    // usar geolocalización del navegador
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.latitude = pos.coords.latitude;
          this.longitude = pos.coords.longitude;
          
          // si el mapa está inicializado, actualizar marcador y centro
          if (this.map) {
            this.setMarker(this.longitude, this.latitude);
          }
          
          this.showToast('Ubicación actual establecida.');
        },
        (err) => {
          console.error('Error obteniendo ubicación:', err);
          this.showToast('No se pudo obtener la ubicación. Verifica los permisos.');
        }
      );
    } else {
      this.showToast('Geolocalización no disponible en tu navegador.');
    }
  }
}
