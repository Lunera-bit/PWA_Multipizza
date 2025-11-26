export interface Product {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  categoria?: string;
  ratingAverage?: number; // promedio (0..5)
  ratingCount?: number;   // número de votos
  favorited?: boolean;
}