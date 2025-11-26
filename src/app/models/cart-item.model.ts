export interface CartItem {
  id: string;
  type?: string;
  title?: string;
  price: number;
  qty: number;
  meta?: any;
}