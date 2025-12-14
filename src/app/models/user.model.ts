export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string;
  createdAt?: any;
  lastLogin?: any;
  rol?: 'cliente' | 'admin' | 'delivery';
}