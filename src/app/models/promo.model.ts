export class promocion {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  imagenUrl?: string;

  constructor(init?: Partial<promocion>) {
    Object.assign(this, init);
  }
}
