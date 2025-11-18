import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapEl!: ElementRef<HTMLElement>;
  @ViewChild('geocoderContainer', { static: false }) geocoderContainer!: ElementRef<HTMLElement>;

  items: any[] = [];
  total = 0;
  step = 1;

  address = '';
  location: { lat: number; lng: number } | null = null;

  instructions = '';
  paying = false;
  showGeocoder = false; // controla visibilidad del input/autocomplete

  private MAPBOX_TOKEN = environment.mapbox.token;

  private destroy$ = new Subject<void>();
  private map: any = null;
  private marker: any = null;
  private MapboxGeocoder: any = null;
  private mapboxgl: any = null;
  private geocoder: any = null; // instancia del geocoder

  constructor(
    private cart: CartService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cart.cart$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.items = (items || []).map(i => ({ ...i, priceNum: Number(i.price ?? (i as any).precio ?? 0) }));
      this.computeTotal();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => void this.initMapbox(), 150);
  }

  private async initMapbox() {
    try {
      const mapbox = await import('mapbox-gl');
      const mbxGeocoder = await import('@mapbox/mapbox-gl-geocoder');
      this.mapboxgl = (mapbox && (mapbox as any).default) || mapbox;
      this.MapboxGeocoder = (mbxGeocoder && (mbxGeocoder as any).default) || mbxGeocoder;

      this.mapboxgl.accessToken = this.MAPBOX_TOKEN;

      const el = this.mapEl?.nativeElement;
      if (!el) return;

      // centro por defecto: Lima (lng, lat)
      const defaultPos: [number, number] = [-77.0428, -12.0464];

      // evitar error de tipado si environment.mapbox no define 'style'
      const mapStyle = (environment as any).mapbox?.style || 'mapbox://styles/mapbox/streets-v11';

      this.map = new this.mapboxgl.Map({
        container: el,
        style: mapStyle,
        center: defaultPos,
        zoom: 13
      });

      this.map.addControl(new this.mapboxgl.NavigationControl());

      // inicializar geocoder pero NO insertarlo aún (lo mostramos solo al click)
      const geocoder = new this.MapboxGeocoder({
        accessToken: this.MAPBOX_TOKEN,
        types: 'address,place',
        placeholder: 'Buscar dirección...',
        mapboxgl: this.mapboxgl
      });
      this.geocoder = geocoder;

      // cuando haya una selección desde geocoder
      geocoder.on('result', (ev: any) => {
        const coords = ev.result.center; // [lng, lat]
        if (coords && coords.length === 2) {
          this.setMarker(coords[1], coords[0], true);
          this.location = { lat: coords[1], lng: coords[0] };
          this.address = ev.result.place_name || this.address;
        }
      });

      // marcador arrastrable
      this.marker = new this.mapboxgl.Marker({ draggable: true });
      this.marker.on('dragend', () => {
        const lngLat = this.marker.getLngLat();
        this.location = { lat: lngLat.lat, lng: lngLat.lng };
      });

      // colocar marcador por defecto en Lima (visible)
      this.setMarker(defaultPos[1], defaultPos[0], false);
    } catch (err) {
      console.error('Error inicializando Mapbox', err);
    }
  }

  // cuando se hace click en el cuadro del mapa: mostramos/insertamos el geocoder y enfocamos input
  async onMapClick() {
    try {
      if (!this.geocoder || !this.map) return;
      // si no está insertado en DOM, lo añadimos al contenedor
      if (this.geocoderContainer && this.geocoderContainer.nativeElement && !this.geocoderContainer.nativeElement.querySelector('input')) {
        this.geocoderContainer.nativeElement.innerHTML = '';
        this.geocoderContainer.nativeElement.appendChild(this.geocoder.onAdd(this.map));
      }
      this.showGeocoder = true;
      // esperar un tick y enfocar el input
      setTimeout(() => {
        try {
          const input = this.geocoderContainer.nativeElement.querySelector('input') as HTMLInputElement | null;
          if (input) { input.focus(); input.select(); }
        } catch (e) {}
      }, 60);
    } catch (e) { console.error(e); }
  }

  hideGeocoder() {
    this.showGeocoder = false;
  }

  // geocodeAddress: si usamos showGeocoder true, usamos geocoder.query()
  async geocodeAddress() {
    if (!this.address) return;
    try {
      if (this.geocoder && typeof this.geocoder.query === 'function') {
        this.geocoder.query(this.address);
        return;
      }
      // fallback a API Mapbox
      const q = encodeURIComponent(this.address);
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${this.MAPBOX_TOKEN}&limit=1&autocomplete=true`);
      const json = await res.json();
      if (json && json.features && json.features.length) {
        const f = json.features[0];
        const [lng, lat] = f.center;
        this.location = { lat, lng };
        this.setMarker(lat, lng, true);
        this.map.flyTo({ center: [lng, lat], zoom: 15 });
        this.address = f.place_name || this.address;
      } else {
        const t = await this.toastCtrl.create({ message: 'Dirección no encontrada', duration: 1600 });
        await t.present();
      }
    } catch (err) {
      const t = await this.toastCtrl.create({ message: 'Error buscando dirección', duration: 1600 });
      await t.present();
    }
  }

  private setMarker(lat: number, lng: number, fly = false) {
    if (!this.marker || !this.map) return;
    this.marker.setLngLat([lng, lat]).addTo(this.map);
    if (fly) this.map.flyTo({ center: [lng, lat], zoom: 15 });
  }

  async useCurrentLocation() {
    // intento usar Capacitor Geolocation si está disponible, si no fallback a navigator
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const cap = await import('@capacitor/geolocation');
        const Geolocation = (cap && (cap as any).Geolocation) || (cap as any).default || (cap as any);
        await Geolocation.requestPermissions?.();
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        const pos: any = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      if (lat !== null && lng !== null) {
        this.location = { lat, lng };
        this.setMarker(lat, lng, true);
        const t = await this.toastCtrl.create({ message: 'Ubicación obtenida', duration: 1300 });
        await t.present();
      }
    } catch (err) {
      const t = await this.toastCtrl.create({ message: 'No se pudo obtener ubicación', duration: 1600 });
      await t.present();
    }
  }

  computeTotal() { this.total = this.items.reduce((s, it) => s + (it.priceNum || 0) * (it.qty || 1), 0); }
  goTo(step: number) { if (step >=1 && step <=4) this.step = step; }
  next() {
    if (this.step === 1) this.step = 2;
    else if (this.step === 2 && this.location) this.step = 3;
    else if (this.step === 3) this.step = 4;
    else if (this.step === 4) this.pay();
  }
  back() { if (this.step > 1) this.step--; else this.router.navigate(['/carrito']); }

  async pay() {
    if (this.paying) return;
    this.paying = true;
    setTimeout(async () => {
      this.paying = false;
      try { await this.cart.clearCart(); } catch {}
      const t = await this.toastCtrl.create({ message: 'Pago realizado. Pedido confirmado.', duration: 2000 });
      await t.present();
      void this.router.navigate(['/inicio']);
    }, 1400);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      try { this.map.remove(); } catch {}
      this.map = null;
    }
  }
}