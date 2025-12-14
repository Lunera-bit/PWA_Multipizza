# Guía del Sistema de Entregas - PWA Multipizza

## Descripción General

Sistema completo de entregas que permite a los usuarios con rol "delivery" aceptar pedidos, rastrear su ubicación en tiempo real, y a los clientes ver dónde está su pedido en un mapa interactivo.

---

## 🏗️ Arquitectura del Sistema

### Flujo General

```
1. CLIENTE
   ├─ Realiza pedido (se guarda en colección 'pedidos')
   ├─ Espera a que delivery acepte
   ├─ Ver rastreo en tiempo real (página /order-tracking/:orderId)
   └─ Ve ubicación de delivery + nombre + distancia + ETA

2. DELIVERY
   ├─ Accede a /delivery-pedidos
   ├─ Ve lista de "Disponibles" (status: pendiente)
   ├─ Acepta un pedido
   ├─ Se inicia tracking automático de su ubicación GPS
   ├─ Actualiza estado a "en camino"
   └─ Marca como "entregado" cuando termina

3. BASE DE DATOS (Firestore - colección 'pedidos')
   └─ Se actualiza en tiempo real con:
      ├─ deliveryPerson (uid, displayName, phone)
      ├─ status (pendiente → en camino → entregado)
      ├─ locationHistory (actualizaciones de GPS)
      └─ timestamps (acceptedAt, completedAt)
```

---

## 📂 Estructura de Ficheros Creados

```
src/app/
├── services/
│   └── tracking.service.ts (252 líneas)
│       ├─ startDeliveryTracking() - Inicia seguimiento GPS
│       ├─ stopDeliveryTracking() - Detiene seguimiento
│       ├─ getDeviceLocation() - Obtiene ubicación (móvil + web)
│       ├─ listenToDeliveryLocation() - Escucha cambios en tiempo real
│       ├─ calculateDistance() - Haversine formula
│       └─ estimateDeliveryTime() - Calcula ETA

├── pages/
│   ├── delivery-pedidos/
│   │   ├─ delivery-pedidos.page.ts (330 líneas)
│   │   │  ├─ Pestaña "Disponibles" (status = 'pendiente')
│   │   │  ├─ Pestaña "Mis Pedidos" (deliveryPerson.uid = currentUser)
│   │   │  ├─ acceptOrder() - Acepta pedido + inicia GPS
│   │   │  └─ markAsDelivered() - Marca como entregado
│   │   └─ delivery-pedidos.page.html (130 líneas)
│   │
│   └── order-tracking/
│       ├─ order-tracking.page.ts (356 líneas)
│       │  ├─ Escucha cambios del pedido en Firestore
│       │  ├─ Escucha ubicación del delivery en tiempo real
│       │  ├─ Renderiza mapa Mapbox con marcadores
│       │  ├─ Calcula distancia dinámicamente
│       │  └─ Muestra ETA
│       └─ order-tracking.page.html (180 líneas)

├── models/
│   └── orden.model.ts (actualizado)
│       ├─ Agregó: interface DeliveryPerson
│       └─ Agregó: deliveryPerson?: DeliveryPerson a Order

├── guards/
│   └── role.guard.ts (actualizado)
│       └─ Añadió soporte para rol 'delivery'

├── app.routes.ts (actualizado)
│   ├─ /delivery-pedidos (requiere auth + rol delivery)
│   └─ /order-tracking/:orderId (requiere auth)

└── components/
    └── header/header/header.component.ts (actualizado)
        └─ Mostrar sección "Delivery" solo si rol === 'delivery'
```

---

## 🔄 Flujo Detallado de Datos

### A. Aceptar un Pedido (Delivery)

```typescript
// 1. Usuario delivery hace clic en "Aceptar"
// 2. acceptOrder() se ejecuta:

await this.trackingService.startDeliveryTracking(order.id);

// 3. TrackingService inicia ciclo de ubicación:
- Detecta si es móvil → usa Capacitor Geolocation
- Si es web → usa Browser Geolocation API
- Cada 10 segundos: obtiene ubicación actual
- Guarda en Firestore: pedidos/{orderId}/locationHistory

// 4. Actualiza documento del pedido:
updateDoc(orderRef, {
  deliveryPerson: {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    phone: currentUser.phoneNumber
  },
  status: 'en camino',
  acceptedAt: new Date()
});
```

### B. Cliente Rastrea Pedido

```typescript
// 1. Cliente navega a /order-tracking/{orderId}
// 2. loadOrder() se ejecuta:

onSnapshot(orderRef, (snapshot) => {
  // Escucha cambios: status, deliveryPerson, etc.
  if (order.deliveryPerson && !unsubscribeLocation) {
    startListeningToDeliveryLocation();
  }
});

// 3. Escucha ubicación en tiempo real:
listenToDeliveryLocation(orderId, (location) => {
  distance = calculateDistance(clientCoords, deliveryCoords);
  estimatedTime = estimateDeliveryTime(distance);
  updateMapMarkers();
});

// 4. Mapa Mapbox muestra:
- 📍 Marcador de cliente (rojo)
- 🚗 Marcador de delivery (verde)
- Línea de conexión
- Distancia actual: X.X km
- ETA: X minutos
```

### C. Marcar Como Entregado

```typescript
// 1. Delivery hace clic en "Marcar como entregado"
// 2. markAsDelivered() actualiza:

updateDoc(orderRef, {
  status: 'entregado',
  completedAt: new Date()
});

// 3. trackingService.stopDeliveryTracking() detiene GPS
// 4. Cliente ve notificación "Pedido entregado"
```

---

## 🗄️ Estructura Firestore

### Colección: `pedidos`

```javascript
{
  id: "abc123def456",
  user: {
    uid: "user123",
    email: "cliente@example.com",
    name: "Juan Pérez",
    phone: "+34612345678"
  },
  items: [
    {
      id: "pizza001",
      title: "Pizza Margarita",
      price: 12.99,
      qty: 2,
      size: "grande",
      type: "pizza"
    }
  ],
  address: {
    street: "Calle Principal 123",
    details: "Apto 4B",
    instructions: "Timbre azul",
    coordinates: {
      lat: 40.4168,
      lng: -3.7038
    }
  },
  payment: {
    amount: "25.98",
    method: "paypal",
    payer: "Juan Pérez",
    status: "completado",
    paypalOrderId: "9ZR47827UC..."
  },
  status: "en camino",
  total: 25.98,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Agregados por delivery:
  deliveryPerson: {
    uid: "delivery456",
    displayName: "Carlos López",
    phone: "+34687654321",
    photoURL: "https://..."
  },
  acceptedAt: Timestamp,
  estimatedDeliveryTime: 30,
  
  // Subcollection: locationHistory
  locationHistory: {
    "timestamp1": { lat: 40.416, lng: -3.703 },
    "timestamp2": { lat: 40.417, lng: -3.704 },
    ...
  }
}
```

---

## 📱 Compatibilidad Móvil

### TrackingService - Detección Automática

```typescript
getDeviceLocation(): Promise<GeolocationCoordinates> {
  if (Capacitor.isNativePlatform()) {
    // Móvil: USA CAPACITOR GEOLOCATION
    return Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  } else {
    // Web: USA BROWSER GEOLOCATION API
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        success,
        error,
        { enableHighAccuracy: true }
      );
    });
  }
}
```

---

## 🎯 Características Principales

### ✅ Implementadas

1. **Página Delivery (/delivery-pedidos)**
   - Pestaña "Disponibles": muestra pedidos sin delivery (status = 'pendiente')
   - Pestaña "Mis Pedidos": muestra tus pedidos aceptados
   - Botón "Aceptar": inicia tracking automático
   - Botón "Entregar": marca pedido como completado
   - Contador de pedidos aceptados

2. **Tracking en Tiempo Real**
   - GPS actualiza cada 10 segundos
   - Se guarda en Firestore automáticamente
   - Funciona en móvil (Capacitor) y web (Browser API)
   - Detiene automáticamente cuando marcan como entregado

3. **Página Cliente (/order-tracking/:orderId)**
   - Mapa Mapbox interactivo
   - Marcadores de cliente (rojo) y delivery (verde)
   - Distancia en km (actualizada en tiempo real)
   - ETA calculado dinámicamente
   - Detalles: nombre delivery, teléfono, estado

4. **Integración de Menú**
   - Sección "Delivery" solo visible si rol = 'delivery'
   - Opción de "Mis Pedidos" y "Pedidos Disponibles"

5. **Seguridad**
   - /delivery-pedidos requiere rol 'delivery'
   - /order-tracking requiere autenticación
   - RoleGuard previene acceso no autorizado

---

## 🛠️ Configuración Requerida

### 1. Token de Mapbox

En [order-tracking.page.ts](src/app/pages/order-tracking/order-tracking.page.ts#L190):

```typescript
const mapboxToken = 'pk.eyJ1IjoiaG9sYTIzMTM0MSIsImEiOiJjbWlmNWx0azkwMjl5M3BwdTYxdDhtNHBmIn0.UX1wDxJ8Bah1BP-OUJAP8Q';
```

**TODO:** Reemplazar con tu token de Mapbox:
1. Ve a https://mapbox.com
2. Inicia sesión o crea cuenta
3. Copia tu Public Access Token
4. Reemplaza en el código

### 2. Capacitor (solo móvil)

El proyecto ya tiene Capacitor configurado. Para compilar APK/iOS:

```bash
# Android
ionic capacitor build android

# iOS
ionic capacitor build ios
```

### 3. Permisos (Android/iOS)

Ya configurados en `capacitor.config.ts`, pero verifica:

```json
{
  "plugins": {
    "Geolocation": {
      "permissions": ["geolocation"]
    }
  }
}
```

---

## 🧪 Pruebas Manuales

### Escenario 1: Aceptar Pedido y Trackear

```
1. Crear 2 cuentas: cliente@test.com (rol: cliente), delivery@test.com (rol: delivery)
2. Cliente: Realiza un pedido
3. Delivery: Inicia sesión → /delivery-pedidos → Tab "Disponibles"
4. Delivery: Haz clic en "Aceptar" → Aparecerá en "Mis Pedidos"
5. Cliente: Realiza un pedido → Espera → Se activa botón "Ver Rastreo"
6. Cliente: Abre /order-tracking/{orderId} → Ve mapa con tu ubicación
7. Delivery: Cambia de ubicación (camina/conduce) → Mapa actualiza en tiempo real
8. Delivery: Haz clic en "Entregado" → Cliente ve "Pedido entregado"
```

### Escenario 2: Probar en Móvil

```
1. ionic build
2. ionic capacitor build android
3. android studio → Run on device
4. Acepta permisos de GPS cuando aparezca
5. Navega como delivery, acepta pedido
6. Mapa debe actualizar mientras te mueves
```

---

## 🐛 Troubleshooting

### Problema: Mapa no aparece en /order-tracking

**Causa:** `address.coordinates` es null
**Solución:** Asegúrate de que el pedido tenga coordenadas configuradas antes de crear la página

### Problema: GPS no funciona en web

**Causa:** Navegador requiere HTTPS para geolocation
**Solución:** Usa `http://localhost` en desarrollo (permitido por navegadores)

### Problema: Firestore index required error

**Causa:** Intentas hacer queries complejas sin índice
**Solución:** Ya está optimizado - usamos client-side filtering

### Problema: Mapbox no carga

**Causa:** Token inválido o expirado
**Solución:** Verifica tu token en https://mapbox.com/account/tokens/

---

## 📊 Queries Optimizadas

### Delivery-Pedidos (sin requerir índices)

```typescript
// ❌ Anterior (requería índice):
// where('status', '==', 'pendiente')
//   .where('deliveryPerson', '==', null)

// ✅ Actual (solo query simple):
where('status', '==', 'pendiente')

// Luego filtra en cliente:
orders.filter(o => !o.deliveryPerson)
```

---

## 🚀 Próximos Pasos (Opcionales)

1. **Notificaciones Reales**
   - Notificar cliente cuando delivery acepta
   - Notificar delivery cuando tiene nuevo pedido disponible

2. **Calificación de Entrega**
   - Añadir stars/comentarios después de entregar

3. **Historial de Entregas**
   - Ver todas las entregas hechas
   - Estadísticas: entregas por día, ingresos, etc.

4. **Optimización de Rutas**
   - Sugerir rutas óptimas entre pedidos
   - Integrar con Google Directions API

5. **Notificaciones Push**
   - Firebase Cloud Messaging (FCM)
   - Alertas cuando delivery está cerca

---

## 📞 Resumen de Endpoints

| Ruta | Rol Requerido | Descripción |
|------|---------------|-------------|
| `/delivery-pedidos` | delivery | Aceptar/entregar pedidos |
| `/order-tracking/:orderId` | (cualquiera autenticado) | Ver rastreo en mapa |
| `/inicio` | cualquiera | Página de inicio |
| `/login` | anónimo | Iniciar sesión |

---

## 🎓 Conceptos Técnicos Utilizados

- **Firestore Listeners**: `onSnapshot()` para actualizaciones en tiempo real
- **RxJS BehaviorSubject**: Gestión de estado de ubicación
- **Capacitor**: Acceso a GPS nativo en móvil
- **Mapbox GL JS**: Renderizado de mapas interactivos
- **Haversine Formula**: Cálculo de distancia entre coordenadas
- **TypeScript**: Tipado fuerte y seguridad
- **Angular Standalone**: Componentes sin módulos

---

**Última actualización:** 2024
**Versiones:**
- Angular: 20
- Ionic: 8
- Capacitor: 6
- Mapbox GL JS: 3.5.0
