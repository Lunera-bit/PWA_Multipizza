import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  async initializeData(): Promise<void> {
    try {
      const db = getFirestore();
      const snapshot = await getDocs(query(collection(db, 'products')));

      if (!snapshot.empty) {
        console.log(
          '[InitService] Colección de productos ya existe:',
          snapshot.size,
          'documentos'
        );
        return;
      }

      const productos = [
        {
          categoria: 'pizzas',
          descripcion:
            'La clásica por excelencia con abundante y sabroso pepperoni.',
          imagen: 'pizzas/Pepperoni.jpg',
          nombre: 'Pepperoni',
          precio: 18.5,
          tags: ['Clásico', 'Carnes', 'Favorita'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Una combinación agridulce de piña, jamón y un toque de salsa BBQ.',
          imagen: 'pizzas/Hawaiana_BBQ.jpg',
          nombre: 'Hawaiana BBQ',
          precio: 21.9,
          tags: ['Agridulce', 'Frutas', 'BBQ', 'Jamón'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Para los que buscan sabor y picante: pollo, champiñones, pimientos y jalapeños.',
          imagen: 'pizzas/Hot_Chiken.jpg',
          nombre: 'Hot Chicken',
          precio: 22.5,
          tags: ['Picante', 'Pollo', 'Vegetales', 'Especial'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Estilo clásico americano con salchicha y la cantidad perfecta de queso.',
          imagen: 'pizzas/Americana.jpg',
          nombre: 'Americana',
          precio: 19.9,
          tags: ['Salchicha', 'Queso', 'Clásico', 'Familiar'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'El festín carnívoro: pepperoni, salchicha, jamón y otras carnes premium.',
          imagen: 'pizzas/Todas_las_Carnes.jpg',
          nombre: 'Todas las Carnes',
          precio: 24.5, // Precio más alto por variedad de carnes
          tags: ['Carnívoro', 'Carnes', 'Premium', 'Relleno'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'La auténtica Margarita realzada con una deliciosa mezcla de 6 tipos de quesos.',
          imagen: 'pizzas/Margarita_6_quesos.jpg',
          nombre: 'Margarita 6 Quesos',
          precio: 20.9,
          tags: ['Vegetariano', 'Quesos', 'Gourmet', 'Margarita'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'La sencillez perfecta: solo queso mozzarella extra y especias.',
          imagen: 'pizzas/Mozzarella.jpg',
          nombre: 'Mozzarella',
          precio: 17.0, // El precio más bajo, básica
          tags: ['Vegetariano', 'Queso', 'Básica', 'Clásico'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Una de nuestras especiales: pollo, tocino, tomate y cremoso aderezo Ranch.',
          imagen: 'pizzas/Chicken_Bacon_Ranch.jpg',
          nombre: 'Chicken Bacon Ranch',
          precio: 23.5,
          tags: ['Pollo', 'Bacon', 'Ranch', 'Especial'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Irresistible tocino crujiente y una rica combinación de 5 quesos.',
          imagen: 'pizzas/Tocino_5_Quesos.jpg',
          nombre: 'Tocino 5 Quesos',
          precio: 22.9,
          tags: ['Bacon', 'Quesos', 'Carnes', 'Gourmet'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Pollo jugoso marinado en salsa BBQ, con cebolla y queso extra.',
          imagen: 'pizzas/Chicken_BBQ.jpg',
          nombre: 'Chicken BBQ',
          precio: 21.5,
          tags: ['Pollo', 'BBQ', 'Ahumado', 'Familiar'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'Una deliciosa mezcla de jamón, champiñones y aceitunas para un sabor internacional.',
          imagen: 'pizzas/Continentalle.jpg',
          nombre: 'Continentalle',
          precio: 22.0,
          tags: ['Jamón', 'Champiñones', 'Aceitunas', 'Europa'],
        },
        {
          categoria: 'pizzas',
          descripcion:
            'La pizza tropical original: jamón y piña para un clásico dulce-salado.',
          imagen: 'pizzas/Hawaiana.jpg',
          nombre: 'Hawaiana',
          precio: 19.5,
          tags: ['Agridulce', 'Frutas', 'Jamón', 'Clásico'],
        },
        {
          categoria: 'complementos',
          descripcion:
            '6 alitas de pollo bañadas en una salsa BBQ ligeramente dulce y picante.',
          imagen: 'complementos/x6_Alitas.png',
          nombre: '6 Alitas BBQ',
          precio: 15.0,
          tags: ['Pollo', 'Picante', 'Carnes', 'BBQ'],
        },
        {
          categoria: 'complementos',
          descripcion:
            '6 rollos de masa suave rellenos de jamón y queso, perfectos para compartir.',
          imagen: 'complementos/Rolls_de_Jamon_x6.png',
          nombre: 'Rolls de Jamón x6',
          precio: 13.5,
          tags: ['Jamón', 'Queso', 'Masa', 'Caliente'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Deliciosos palitos de pan cubiertos con queso derretido extra. ¡Ideales para dipear!',
          imagen: 'complementos/Cheesesticks.png',
          nombre: 'Cheesesticks',
          precio: 11.0,
          tags: ['Queso', 'Vegetariano', 'Acompañamiento'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Palitos de masa con un toque de queso parmesano y un glaseado de mostaza y miel.',
          imagen: 'complementos/Palitos_a_la_Parmesana.png',
          nombre: 'Palitos a la Parmesana',
          precio: 10.5,
          tags: ['Queso', 'Masa', 'Parmesan'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Bocados de pollo crujientes y jugosos, perfectos como aperitivo.',
          imagen: 'complementos/Chicken_Poppers.png',
          nombre: 'Chicken Poppers',
          precio: 14.0,
          tags: ['Pollo', 'Frito', 'Aperitivo'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Pan plano al estilo focaccia con cebolla, especias y un toque de mayonesa.',
          imagen: 'complementos/Fugazza.png',
          nombre: 'Fugazza',
          precio: 12.0,
          tags: ['Pan', 'Cebolla', 'Vegetariano', 'Argentina'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Una pizza pequeña cortada en tiras con abundante mozzarella derretida.',
          imagen: 'complementos/Mini_Cheesesticks.png',
          nombre: 'Mini Cheesesticks',
          precio: 9.5, // Más económico por ser "Mini"
          tags: ['Queso', 'Masa', 'Compartir'],
        },
        {
          categoria: 'complementos',
          descripcion:
            'Pan tostado con tomate fresco picado y aderezo. Una entrada ligera y sabrosa.',
          imagen: 'complementos/Crostini_de_Tomate.png',
          nombre: 'Crostini de Tomate',
          precio: 11.5,
          tags: ['Tomate', 'Vegetariano', 'Light', 'Entrada'],
        },
        {
    categoria: 'bebidas',
    descripcion: 'Agua de mesa sin gas, perfecta para refrescarse e hidratarse.',
    imagen: 'bebidas/San_Luis_750ml.png',
    nombre: 'Agua San Luis 750ml',
    precio: 4.5,
    tags: ['Agua', 'Sin Gas', 'Natural', '750ml'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'Bebida gasificada de sabor original, en presentación grande de 1.5 litros (Sin Azúcar).',
    imagen: 'bebidas/Coca_Cola_1.5Lt.png',
    nombre: 'Coca-Cola 1.5Lt Sin Azúcar',
    precio: 9.0,
    tags: ['Gaseosa', 'Cola', 'Sin Azúcar', '1.5L'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'Bebida gasificada de sabor original y refrescante, en tamaño personal de 500ml.',
    imagen: 'bebidas/Coca_Cola_500ml.png',
    nombre: 'Coca-Cola 500ml Original',
    precio: 4.0,
    tags: ['Gaseosa', 'Cola', 'Original', '500ml'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'Bebida gasificada de sabor original en la presentación de 1 litro.',
    imagen: 'bebidas/Coca_Cola_1Lt.png',
    nombre: 'Coca-Cola 1Lt Original',
    precio: 6.5,
    tags: ['Gaseosa', 'Cola', 'Original', '1L'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'La gaseosa de sabor a naranja más popular, en presentación personal de 500ml.',
    imagen: 'bebidas/Fanta_500ml.png',
    nombre: 'Fanta Naranja 500ml',
    precio: 4.0,
    tags: ['Gaseosa', 'Naranja', 'Frutas', '500ml'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'El sabor nacional de Perú en su versión de 1.5 litros (Sin Azúcar).',
    imagen: 'bebidas/Inca_Kola_1.5Lt.png',
    nombre: 'Inca Kola 1.5Lt Sin Azúcar',
    precio: 9.5,
    tags: ['Gaseosa', 'Nacional', 'Sin Azúcar', '1.5L'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'El sabor nacional en presentación de 1 litro.',
    imagen: 'bebidas/Inka_Kola_1Lt.png',
    nombre: 'Inca Kola 1Lt Original',
    precio: 7.0,
    tags: ['Gaseosa', 'Nacional', 'Original', '1L'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'El sabor nacional en presentación personal de 500ml.',
    imagen: 'bebidas/Inca_Kola_500ml.png',
    nombre: 'Inca Kola 500ml Original',
    precio: 4.0,
    tags: ['Gaseosa', 'Nacional', 'Original', '500ml'],
  },
  {
    categoria: 'bebidas',
    descripcion: 'Bebida gasificada de lima-limón sin azúcar en botella de 500ml.',
    imagen: 'bebidas/Sprite_Sin_Azucar_500ml.png',
    nombre: 'Sprite Sin Azúcar 500ml',
    precio: 4.0,
    tags: ['Gaseosa', 'Lima-Limón', 'Sin Azúcar', '500ml'],
  },
      ];

      for (const producto of productos) {
        await addDoc(collection(db, 'products'), producto);
      }
      console.log('[InitService] Colección de productos creada exitosamente');
    } catch (error) {
      console.error('[InitService] Error al crear productos:', error);
    }
  }
}
