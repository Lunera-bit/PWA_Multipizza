import { CartItem } from './cart-item.model';

export type OrderStatus = 'pendiente' | 'cancelado' | 'entregado' | 'en camino';

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  size?: string;
  type?: string;
}

export interface Address {
  coordinates?: {
    lat: number;
    lng: number;
  } | [number, number];
  lat?: number;
  lng?: number;
  details?: string;
  street?: string;
  instructions?: string;
}

export interface Payment {
  amount: string;
  method: string;
  payer: string;
  paypalOrderId?: string;
  status: string;
}

export interface User {
  email: string;
  name: string;
  phone: string;
  uid: string;
}

export interface DeliveryPerson {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  phone?: string;
}

export interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

export interface Order {
  id?: string;
  address?: Address;
  items: OrderItem[];
  payment?: Payment;
  status: OrderStatus;
  total: number;
  user?: User;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  deliveryPerson?: DeliveryPerson;
  acceptedAt?: any;
  estimatedDeliveryTime?: number; // en minutos
  routeGeometry?: RouteGeometry; // Geometría de la ruta
  routeDistance?: number; // Distancia en km
  routeDuration?: number; // Duración en minutos
  deliveredAt?: any; // Timestamp de entrega
}
