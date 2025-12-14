// Archivo: src/app/models/tracking.model.ts
// Modelos adicionales para tracking

export interface RouteInfo {
  distance: number; // km
  duration: number; // minutos
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export interface TrackingSession {
  orderId: string;
  driverId: string;
  startedAt: Date;
  endedAt?: Date;
  pathHistory: LocationPoint[];
  totalDistance: number;
  totalDuration: number;
  status: 'active' | 'completed' | 'paused';
}

export interface DeliveryMetrics {
  orderId: string;
  estimatedDistance: number;
  estimatedDuration: number;
  actualDistance: number;
  actualDuration: number;
  deviationPercent: number;
  averageSpeed: number; // km/h
  timestamp: Date;
}
