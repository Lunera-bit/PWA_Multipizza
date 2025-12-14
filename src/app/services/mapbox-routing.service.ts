import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Route {
  distance: number; // en metros
  duration: number; // en segundos
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: Array<{
    distance: number;
    duration: number;
    steps: any[];
  }>;
}

export interface RouteResponse {
  routes: Route[];
  waypoints: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  message?: string;
}

export interface MatrixResponse {
  code: string;
  durations: number[][];
  distances: number[][];
  sources: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
  destinations: Array<{
    hint: string;
    distance: number;
    name: string;
    location: [number, number];
  }>;
}

export interface GeocodeResult {
  id: string;
  type: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  bbox?: [number, number, number, number];
  properties: Record<string, any>;
}

export interface GeocodeResponse {
  type: string;
  query: string[];
  features: GeocodeResult[];
  attribution: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapboxRoutingService {
  private mapboxToken = environment.mapboxToken;
  private directionsUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving';
  private matrixUrl = 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving';
  private geocodingUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private http: HttpClient) {}

  /**
   * Obtener ruta entre dos puntos
   */
  getRoute(
    origin: [number, number],
    destination: [number, number],
    alternatives: boolean = false,
    steps: boolean = true,
    geometries: 'geojson' | 'polyline' | 'polyline6' = 'geojson',
    overview: 'full' | 'simplified' | 'false' = 'full'
  ): Observable<RouteResponse> {
    const url = `${this.directionsUrl}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const params = {
      alternatives: alternatives ? 'true' : 'false',
      steps: steps ? 'true' : 'false',
      geometries,
      overview,
      access_token: this.mapboxToken
    };

    return this.http.get<RouteResponse>(url, { params: params as any });
  }

  /**
   * Obtener múltiples rutas (para optimización)
   */
  getMultipleRoutes(
    coordinates: [number, number][]
  ): Observable<RouteResponse> {
    const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
    const url = `${this.directionsUrl}/${coordString}`;
    const params = {
      alternatives: 'true',
      steps: 'true',
      geometries: 'geojson',
      overview: 'full',
      access_token: this.mapboxToken
    };

    return this.http.get<RouteResponse>(url, { params: params as any });
  }

  /**
   * Obtener matriz de distancias y tiempos (Matrix API)
   * Permite calcular distancias entre múltiples puntos
   */
  getMatrix(
    sources: [number, number][],
    destinations: [number, number][]
  ): Observable<MatrixResponse> {
    const sourceString = sources.map(c => `${c[0]},${c[1]}`).join(';');
    const destString = destinations.map(c => `${c[0]},${c[1]}`).join(';');
    const url = `${this.matrixUrl}/${sourceString};${destString}`;

    const params = {
      access_token: this.mapboxToken
    };

    return this.http.get<MatrixResponse>(url, { params: params as any });
  }

  /**
   * Obtener distancia y ETA entre dos puntos
   */
  getDistanceAndETA(
    origin: [number, number],
    destination: [number, number]
  ): Observable<{
    distance: number; // en km
    duration: number; // en minutos
    distanceMeters: number;
    durationSeconds: number;
  }> {
    return this.getRoute(origin, destination, false, false).pipe(
      map(response => {
        if (response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          return {
            distance: Math.round((route.distance / 1000) * 100) / 100, // km
            duration: Math.ceil(route.duration / 60), // minutos
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration)
          };
        }
        throw new Error('No route found');
      })
    );
  }

  /**
   * Geocodificar una dirección (convertir texto a coordenadas)
   */
  geocodeAddress(query: string, proximity?: [number, number]): Observable<GeocodeResponse> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${this.geocodingUrl}/${encodedQuery}.json`;

    let params: any = {
      access_token: this.mapboxToken,
      country: 'PE', // Para Perú
      limit: 5
    };

    if (proximity) {
      params.proximity = `${proximity[0]},${proximity[1]}`;
    }

    return this.http.get<GeocodeResponse>(url, { params });
  }

  /**
   * Geocodificación inversa (convertir coordenadas a dirección)
   */
  reverseGeocode(coordinates: [number, number]): Observable<GeocodeResponse> {
    const url = `${this.geocodingUrl}/${coordinates[0]},${coordinates[1]}.json`;

    const params = {
      access_token: this.mapboxToken,
      country: 'PE'
    };

    return this.http.get<GeocodeResponse>(url, { params });
  }

  /**
   * Obtener ruta optimizada para múltiples entregas
   */
  getOptimizedRoute(coordinates: [number, number][]): Observable<RouteResponse> {
    // Usar la ruta normal pero con todas las coordenadas
    // Para verdadera optimización, sería necesario usar Mapbox Optimization API (requiere acceso especial)
    return this.getMultipleRoutes(coordinates);
  }

  /**
   * Calcular distancia entre dos coordenadas (Haversine)
   * Usa la fórmula de Haversine como fallback rápido
   */
  calculateHaversineDistance(
    origin: [number, number],
    destination: [number, number]
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (destination[1] - origin[1]) * (Math.PI / 180);
    const dLon = (destination[0] - origin[0]) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin[1] * (Math.PI / 180)) *
        Math.cos(destination[1] * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Decodificar polyline (formato comprimido de rutas)
   */
  decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lat += (result & 1 ? ~(result >> 1) : result >> 1);
      result = 0;
      shift = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lng += (result & 1 ? ~(result >> 1) : result >> 1);
      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  }

  /**
   * Codificar coordenadas a polyline
   */
  encodePolyline(points: [number, number][]): string {
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    points.forEach(([lng, lat]) => {
      const dlat = Math.round((lat - prevLat) * 1e5);
      const dlng = Math.round((lng - prevLng) * 1e5);

      encoded += this.encodeValue(dlat) + this.encodeValue(dlng);

      prevLat = lat;
      prevLng = lng;
    });

    return encoded;
  }

  private encodeValue(value: number): string {
    value = value << 1;
    if (value < 0) value = ~value;

    let encoded = '';
    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    encoded += String.fromCharCode(value + 63);
    return encoded;
  }

  /**
   * Obtener bounds de un conjunto de coordenadas
   */
  getBounds(coordinates: [number, number][]): {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null {
    if (coordinates.length === 0) return null;

    let minLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLng = coordinates[0][0];
    let maxLat = coordinates[0][1];

    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });

    return { minLng, minLat, maxLng, maxLat };
  }
}
