/**
 * EJEMPLOS DE USO - Sistema de Delivery y Tracking
 * 
 * Este archivo contiene ejemplos de cómo usar el sistema implementado
 * NOTA: Este archivo es de referencia y no se compila directamente
 */

// ============================================
// 1. CREAR UN PEDIDO CON UBICACIÓN
// ============================================

/*
import { Order } from 'src/app/models/orden.model';
import { OrdenService } from 'src/app/services/orden.service';

// Ejemplo de datos de un pedido
const newOrder: Order = {
  items: [
    {
      id: '1',
      title: 'Pizza Pepperoni Large',
      price: 18.99,
      qty: 1,
      size: 'Large',
    },
    {
      id: '2',
      title: 'Coca Cola 2L',
      price: 5.99,
      qty: 1,
    },
  ],
  status: 'pendiente',
  total: 24.98,
  payment: {
    amount: '24.98',
    method: 'card',
    payer: 'Juan Pérez',
    status: 'completed',
  },
  user: {
    uid: 'user123',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+56912345678',
  },
  address: {
    street: 'Calle Principal 123, Apt 4B',
    details: 'Casa con portón azul',
    instructions: 'Tocar timbre 3 veces',
    coordinates: {
      lat: -33.8688, // Latitud (Santiago, Chile)
      lng: -51.2093, // Longitud
    },
  },
  notes: 'Sin cebolla por favor',
};

// Crear la orden
// await ordenService.createOrden(newOrder);
*/

// ============================================
// 2. ACEPTAR UN PEDIDO COMO DELIVERY
// ============================================

/*
import { TrackingService } from 'src/app/services/tracking.service';

const deliveryPersonData = {
  uid: 'delivery123',
  displayName: 'Carlos García',
  photoURL: 'https://example.com/photo.jpg',
  phone: '+56987654321',
};

// Cuando un delivery acepta un pedido:
// 1. Comienza el seguimiento de ubicación
// 2. Se actualiza la orden con la info del delivery

async function acceptOrderAsDelivery(orderId: string) {
  // Iniciar seguimiento
  // await trackingService.startDeliveryTracking(orderId);
  
  // Actualizar orden con info del delivery
  // await ordenService.updateOrden(orderId, {
  //   status: 'en camino',
  //   deliveryPerson: deliveryPersonData,
  //   acceptedAt: new Date(),
  // });
}
*/

// ============================================
// 3. CLIENTE VE SEGUIMIENTO EN TIEMPO REAL
// ============================================

/*
// En order-tracking.page.ts
// El cliente accede a /order-tracking/{orderId}

// La página:
// 1. Carga la orden
// 2. Escucha cambios de ubicación del delivery
// 3. Muestra el mapa con ambas ubicaciones
// 4. Actualiza distancia y tiempo estimado cada segundo
*/

// ============================================
// 4. QUERIES ÚTILES PARA FIRESTORE
// ============================================

/*
// Obtener pedidos disponibles (sin delivery asignado)
db.collection('pedidos')
  .where('status', '==', 'pendiente')
  .orderBy('createdAt', 'desc')
  .limit(10)

// Obtener pedidos de un cliente
db.collection('pedidos')
  .where('user.uid', '==', 'user123')
  .orderBy('createdAt', 'desc')

// Obtener pedidos aceptados por un delivery
db.collection('pedidos')
  .where('deliveryPerson.uid', '==', 'delivery123')
  .where('status', 'in', ['en camino', 'pendiente'])
  .orderBy('createdAt', 'desc')

// Obtener pedidos entregados (para historial)
db.collection('pedidos')
  .where('deliveryPerson.uid', '==', 'delivery123')
  .where('status', '==', 'entregado')
  .orderBy('updatedAt', 'desc')
*/

// ============================================
// 5. FLUJO COMPLETO DE UN PEDIDO
// ============================================

/*
ESTADO INICIAL: pendiente
- deliveryPerson: null
- status: 'pendiente'
- Visible para: admin, delivery (en lista disponible)

DELIVERY ACEPTA:
- status: 'en camino'
- deliveryPerson: {...}
- acceptedAt: timestamp
- Se inicia seguimiento de ubicación
- Cliente puede ver orden-tracking

DELIVERY MARCA ENTREGADO:
- status: 'entregado'
- Se detiene seguimiento
- Cliente ve confirmación de entrega

CANCELAR:
- status: 'cancelado'
- deliveryPerson: null
- Vuelve a estar disponible
*/

// ============================================
// 6. UBICACIONES DE PRUEBA
// ============================================

const testLocations = {
  santiago: { lat: -33.8688, lng: -51.2093 },
  providencia: { lat: -33.4274, lng: -70.6086 },
  vitacura: { lat: -33.3872, lng: -70.5889 },
  lasConde: { lat: -33.4211, lng: -70.5898 },
  ñuñoa: { lat: -33.4307, lng: -70.5779 },
  estación: { lat: -33.4495, lng: -70.6674 },
};

// ============================================
// 7. INTEGRACIÓN CON EL MENÚ
// ============================================

/*
En app.component.ts, agregar opción de menú para delivery:

<ion-menu contentId="main-content" side="start">
  <ion-header>
    <ion-toolbar>
      <ion-title>Menú</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-list>
      <ion-item 
        [routerLink]="['/delivery-pedidos']"
        *ngIf="userRole === 'delivery'"
      >
        <ion-icon slot="start" name="car-outline"></ion-icon>
        <ion-label>Mis Pedidos</ion-label>
      </ion-item>
      <!-- ... otros items ... -->
    </ion-list>
  </ion-content>
</ion-menu>
*/

// ============================================
// 8. NOTIFICACIONES AL CLIENTE
// ============================================

/*
Cuando el delivery acepta el pedido:
- Enviar notificación al cliente: "Tu pedido ha sido aceptado"
- Mostrar botón "Ver ubicación"

Cuando se entrega:
- Enviar notificación: "Tu pedido ha sido entregado"
- Solicitar calificación del delivery
*/

// ============================================
// 9. SEGURIDAD Y VALIDACIONES
// ============================================

/*
Validaciones recomendadas:

1. En order-tracking.page.ts:
   - Verificar que el usuario sea el cliente o un admin
   - No permitir ver órdenes de otros clientes

2. En delivery-pedidos.page.ts:
   - Verificar que el usuario tenga rol 'delivery'
   - Solo puede aceptar pedidos sin asignar

3. En tracking.service.ts:
   - Verificar que el usuario sea el delivery asignado
   - Solo puede actualizar su propia ubicación

Reglas de Firestore (ver DELIVERY_SETUP.md):
- Controlar quién puede leer/escribir en cada colección
*/

// ============================================
// 10. MONITOREO Y DEBUGGING
// ============================================

/*
Útil para debugging:

// En la consola del navegador
firebase.firestore().collection('pedidos').doc('orderId').get()
  .then(doc => console.log(doc.data()));

// Ver órdenes en tiempo real
firebase.firestore().collection('pedidos')
  .onSnapshot(snap => {
    snap.docs.forEach(doc => console.log(doc.id, doc.data()));
  });

// Verificar ubicación actual
navigator.geolocation.getCurrentPosition(pos => {
  console.log('Lat:', pos.coords.latitude);
  console.log('Lng:', pos.coords.longitude);
});
*/
