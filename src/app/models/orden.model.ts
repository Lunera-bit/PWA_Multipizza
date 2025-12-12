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
  };
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
}
