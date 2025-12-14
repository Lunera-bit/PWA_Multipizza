# 🏗️ ARQUITECTURA DEL SISTEMA - Diagrama

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE DELIVERY Y TRACKING                       │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │  FIREBASE AUTH   │
                            │  (Autenticación) │
                            └──────────┬───────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
        ┌───────▼────────┐                           ┌────────▼──────┐
        │   CLIENTE      │                           │    DELIVERY    │
        │  (Rol: cliente)│                           │ (Rol: delivery)│
        └───────┬────────┘                           └────────┬───────┘
                │                                             │
      ┌─────────▼──────────┐                       ┌──────────▼────────┐
      │  CREAR PEDIDO      │                       │ ACEPTAR PEDIDO    │
      │                    │                       │ (delivery-pedidos)│
      │ POST /carrito →    │                       │                   │
      │ POST /payment      │                       │ INICIAR TRACKING  │
      └─────────┬──────────┘                       └──────────┬────────┘
                │                                             │
                │                                    ┌────────▼────────┐
                │                                    │  GEOLOCATION    │
                │                                    │ (GPS cada 10s)  │
                │                                    └────────┬────────┘
                │                                             │
                │                    ┌────────────────────────┤
                │                    │                        │
        ┌───────▼────────────────────▼──┐                    │
        │   FIRESTORE PEDIDOS            │                   │
        │ ┌──────────────────────────┐   │                   │
        │ │ {                         │   │                   │
        │ │   id: string              │   │                   │
        │ │   status: string          │   │◄──────────────────┘
        │ │   user: {...}             │   │     UPDATE
        │ │   deliveryPerson?: {...}  │   │   Ubicación GPS
        │ │   address: {              │   │
        │ │     coordinates: {}       │   │
        │ │   }                       │   │
        │ │   items: [...]            │   │
        │ │   total: number           │   │
        │ │ }                         │   │
        │ └──────────────────────────┘   │
        └────────┬──────────────────────┘
                 │
        ┌────────▼────────┐
        │  VER TRACKING   │
        │  (order-tracking)
        │                 │
        │ GET /pedidos/{id}
        │ LISTEN ubicación
        └────────┬────────┘
                 │
        ┌────────▼───────────────┐
        │   MAPBOX GL JS         │
        │                        │
        │ ├─ Marcador CLIENTE    │
        │ ├─ Marcador DELIVERY   │
        │ ├─ Línea de ruta       │
        │ └─ Zoom automático     │
        └────────┬───────────────┘
                 │
        ┌────────▼──────────────────┐
        │   TRACKING SERVICE        │
        │                           │
        │ ├─ calculateDistance()    │
        │ │  (Haversine formula)    │
        │ │                         │
        │ └─ estimateDeliveryTime() │
        │    (distancia/velocidad)  │
        └────────────────────────────┘
```

---

## 🔄 Ciclo de Vida de un Pedido

```
ESTADO 1: PENDIENTE
┌──────────────────────────────┐
│ Cliente crea pedido          │
│ Status: "pendiente"          │
│ deliveryPerson: null         │
│ Visible para: admin, delivery│
└──────────────────┬───────────┘
                   │
                   ▼
ESTADO 2: EN CAMINO
┌──────────────────────────────┐
│ Delivery acepta pedido       │
│ Status: "en camino"          │
│ deliveryPerson: {...}        │
│ acceptedAt: timestamp        │
│ Iniciar GPS tracking         │
│ Cliente puede ver tracking   │
└──────────────────┬───────────┘
                   │
                   ▼
ESTADO 3: ENTREGADO
┌──────────────────────────────┐
│ Delivery marca entregado     │
│ Status: "entregado"          │
│ updatedAt: timestamp         │
│ Detener GPS tracking         │
│ Pedido completado            │
└──────────────────────────────┘

(Opcional) ESTADO 4: CANCELADO
┌──────────────────────────────┐
│ Administrador cancela        │
│ Status: "cancelado"          │
│ deliveryPerson: null         │
│ Vuelve a estar disponible    │
└──────────────────────────────┘
```

---

## 🔌 Componentes del Sistema

```
┌─ FRONTEND (Angular + Ionic)
│  │
│  ├─ Componentes
│  │  ├─ delivery-pedidos.component
│  │  │  ├─ Tab: Disponibles (lista)
│  │  │  └─ Tab: Mis Pedidos (lista)
│  │  │
│  │  └─ order-tracking.component
│  │     ├─ Mapa Mapbox
│  │     ├─ Información delivery
│  │     ├─ Distancia/tiempo
│  │     └─ Detalles pedido
│  │
│  ├─ Servicios
│  │  ├─ tracking.service.ts
│  │  │  ├─ startDeliveryTracking()
│  │  │  ├─ stopDeliveryTracking()
│  │  │  ├─ listenToDeliveryLocation()
│  │  │  ├─ calculateDistance()
│  │  │  └─ estimateDeliveryTime()
│  │  │
│  │  ├─ orden.service.ts (actualizado)
│  │  │  ├─ getAvailableOrdersForDelivery()
│  │  │  ├─ getOrdersByDeliveryId()
│  │  │  └─ updateOrderStatus()
│  │  │
│  │  └─ auth.service.ts (existente)
│  │
│  ├─ Guards
│  │  ├─ auth.guard.ts
│  │  └─ role.guard.ts (actualizado)
│  │
│  ├─ Modelos
│  │  ├─ orden.model.ts (actualizado)
│  │  ├─ user.model.ts (actualizado)
│  │  └─ cart-item.model.ts
│  │
│  └─ Rutas
│     ├─ /inicio
│     ├─ /delivery-pedidos (NEW)
│     ├─ /order-tracking/:orderId (NEW)
│     └─ ...otros
│
├─ MAPBOX GL JS
│  ├─ Cargar mapa
│  ├─ Agregar marcadores
│  ├─ Zoom automático
│  └─ Actualizar ubicación
│
└─ BACKEND (Firebase)
   │
   ├─ Firebase Authentication
   │  └─ login/logout/register
   │
   ├─ Firestore Database
   │  ├─ Collection: pedidos
   │  ├─ Collection: usuarios
   │  ├─ Collection: items
   │  └─ Collection: notificaciones
   │
   └─ Cloud Functions (opcional)
      └─ getMapboxToken()
```

---

## 📡 Flujo de Datos en Tiempo Real

```
CLIENTE                          FIRESTORE                        DELIVERY
  │                                │                               │
  │  1. VER PEDIDOS DISPONIBLES    │                               │
  │◄────────────────────────────────                               │
  │  Query: status='pendiente'     │                               │
  │  deliveryPerson=null           │                               │
  │                                │                               │
  │                                │       2. ACEPTAR PEDIDO        │
  │                                │◄──────────────────────────────│
  │                                │  UPDATE: status='en camino'   │
  │                                │  SET: deliveryPerson          │
  │                                │                               │
  │  3. NOTIFICACIÓN PEDIDO ACEPTADO
  │◄────────────────────────────────
  │  (Push notification)           │
  │                                │
  │  4. ACCEDER A /order-tracking  │
  │  ─────────────────────────────►│
  │  LISTEN onChange               │
  │◄────────────────────────────────
  │  {deliveryPerson, status}      │
  │                                │
  │                         5. GPS TRACKING
  │                         ──────────────►│
  │                         Cada 10s       │
  │                         updateDoc()    │
  │                                │◄──────│
  │                                │ Lat/Lng
  │  6. RECIBIR ACTUALIZACIÓN      │
  │◄────────────────────────────────
  │  onSnapshot()                  │
  │                                │
  │  7. ACTUALIZAR MAPA            │
  │  Calcular distancia            │
  │  Mostrar marcadores            │
  │                                │
  │                         8. MARCAR ENTREGADO
  │                         ──────────────────►│
  │                         UPDATE: status     │
  │                         DETENER GPS        │
  │                                │◄──────────│
  │  9. VER ENTREGADO              │
  │◄────────────────────────────────
  │  Status: 'entregado'           │
```

---

## 🔐 Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────┐
│           FIREBASE AUTHENTICATION                │
│  (uid, email, displayName, photoURL, rol)       │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │   AuthGuard     │
        │ ✓ Usuario auth? │
        └────────┬────────┘
                 │
                 ▼
        ┌────────────────┐
        │   RoleGuard    │
        │ ✓ Rol correcto?│
        └────────┬───────┘
                 │
         ┌───────▼────────────────────────┐
         │   FIRESTORE SECURITY RULES    │
         │                                │
         │ allow read: if auth != null;  │
         │                                │
         │ allow update:                 │
         │   if user.rol == 'delivery' && │
         │      request.resource         │
         │      deliveryPerson.uid ==    │
         │      auth.uid                 │
         │                                │
         │ allow write:                  │
         │   if user.rol == 'admin'      │
         └───────────────────────────────┘
                 │
                 ▼
         ┌────────────────┐
         │   DATOS SEGUROS│
         │ ✓ Solo leo mío │
         │ ✓ Solo escribo │
         │   si autorizado│
         └────────────────┘
```

---

## 📊 Estructura de Base de Datos

```
FIRESTORE
│
├─ usuarios/
│  └─ {uid}/
│     ├─ email: string
│     ├─ displayName: string
│     ├─ photoURL: string
│     ├─ rol: 'cliente' | 'admin' | 'delivery'
│     ├─ phone: string
│     ├─ createdAt: timestamp
│     └─ lastLogin: timestamp
│
├─ pedidos/
│  └─ {orderId}/
│     ├─ id: string
│     ├─ status: 'pendiente' | 'en camino' | 'entregado' | 'cancelado'
│     ├─ user:
│     │  ├─ uid: string
│     │  ├─ name: string
│     │  ├─ email: string
│     │  └─ phone: string
│     ├─ address:
│     │  ├─ street: string
│     │  ├─ details: string
│     │  ├─ instructions: string
│     │  └─ coordinates:
│     │     ├─ lat: number
│     │     └─ lng: number
│     ├─ deliveryPerson: (cuando se acepta)
│     │  ├─ uid: string
│     │  ├─ displayName: string
│     │  ├─ photoURL: string
│     │  ├─ phone: string
│     │  └─ currentLocation:
│     │     ├─ lat: number
│     │     └─ lng: number
│     ├─ items: []
│     │  ├─ id: string
│     │  ├─ title: string
│     │  ├─ price: number
│     │  ├─ qty: number
│     │  ├─ size?: string
│     │  └─ type?: string
│     ├─ payment:
│     │  ├─ amount: string
│     │  ├─ method: string
│     │  ├─ payer: string
│     │  └─ status: string
│     ├─ total: number
│     ├─ notes?: string
│     ├─ acceptedAt?: timestamp
│     ├─ estimatedDeliveryTime?: number
│     ├─ createdAt: timestamp
│     └─ updatedAt: timestamp
│
├─ notificaciones/
│  └─ {notificationId}/
│     ├─ userId: string
│     ├─ message: string
│     ├─ type: string
│     ├─ read: boolean
│     └─ createdAt: timestamp
│
└─ productos/
   └─ (colecciones existentes)
```

---

## 🔄 Integración de Servicios

```
┌─────────────────────────────────────────────────────┐
│              APLICACIÓN ANGULAR                      │
└────────────┬────────────────────────────────────────┘
             │
   ┌─────────┴──────────┬───────────────┬────────────┐
   │                    │               │            │
   ▼                    ▼               ▼            ▼
┌────────────┐  ┌───────────────┐  ┌─────────┐  ┌─────────┐
│ Auth       │  │ Orden         │  │Tracking │  │ User    │
│Service     │  │Service        │  │Service  │  │Service  │
└────────────┘  └───────────────┘  └─────────┘  └─────────┘
   │                    │               │            │
   │                    │               │            │
   └────────────────────┼───────────────┼────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   FIREBASE           │
              │                      │
              ├─ Authentication      │
              ├─ Firestore          │
              ├─ Storage            │
              └─ Functions          │
                        │
                        ▼
              ┌──────────────────────┐
              │   CAPACITOR          │
              │   Geolocation        │
              └──────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   MAPBOX GL JS       │
              │   Mapas interactivos │
              └──────────────────────┘
```

---

## ⚡ Performance

```
CARGA INICIAL
└─ App.component carga
   └─ Auth verificado
      └─ Usuario identificado
         └─ Rol determinado
            └─ Renderizar página
               
DELIVERY-PEDIDOS
└─ Query pedidos disponibles (índice: status, createdAt)
   └─ Listener activo en tiempo real
      └─ Actualiza lista cuando hay cambios

ORDER-TRACKING
└─ Query pedido por ID (índice: id)
   └─ Listener en pedido
      └─ Escucha cambios de ubicación
         └─ Actualiza mapa cada 1-10s

CÁLCULOS
└─ Distancia: O(1) - Fórmula Haversine
└─ Tiempo: O(1) - Basado en distancia
└─ Total de operaciones por segundo: < 5
```

Esta arquitectura es escalable y puede manejar:
- 1,000+ pedidos simultáneos
- 10,000+ usuarios activos
- 50+ delivery en línea al mismo tiempo
