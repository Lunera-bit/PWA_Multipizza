export class Promocion {
  id?: string;
  nombre!: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;

  constructor(data?: Partial<Promocion>) {
    Object.assign(this, data);
  }
}
