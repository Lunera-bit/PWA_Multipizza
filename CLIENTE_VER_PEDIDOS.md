# ¿Dónde ve el Cliente sus Pedidos?

## 📍 Ubicación de la Página

**Ruta:** `/pedidos`

**Archivo:** [src/app/pages/pedidos/pedidos.page.ts](src/app/pages/pedidos/pedidos.page.ts)

---

## 🗺️ Flujo de Navegación

```
Cliente inicia sesión
    ↓
Página /inicio (home)
    ↓
Menú o botón "Mis Pedidos"
    ↓
/pedidos (ESTA PÁGINA)
    ↓
Lista de todos sus pedidos con estado
    ↓
Hace clic en un pedido
    ↓
Modal con detalles completos
```

---

## 🎯 ¿Cómo accede el cliente?

### Opción 1: Desde el Menú
- Abre el menú lateral de Ionic
- Busca la opción "Mis Pedidos" o "Pedidos"
- Hace clic → Va a `/pedidos`

### Opción 2: Desde un ícono/botón en la toolbar
- En la página de inicio hay un botón que lleva a `/pedidos`

---

## 📋 ¿Qué ve en la página de Pedidos?

### Vista General (Lista)
```
┌─────────────────────────────────────────┐
│           Mis Pedidos                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Pedido #abc123def456       S/. 45.99│  │
│  │ 13 de diciembre, 2025      En camino│  │
│  │ 3 productos · Calle Main 123        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Pedido #xyz789uvw012       S/. 32.50│  │
│  │ 12 de diciembre, 2025      Entregado│  │
│  │ 2 productos · Apto 5B               │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

Cada tarjeta muestra:
- **ID del pedido** (ej: #abc123)
- **Fecha de creación** (formateada)
- **Total** (en soles)
- **Estado**: Pendiente | En camino | Entregado | Cancelado
- **Resumen**: Cantidad de productos + dirección de entrega

---

## 🔄 Estados Posibles

| Estado | Color/Indicador | Significado |
|--------|-----------------|------------|
| **Pendiente** | ⚪ Gris | Esperando que delivery acepte |
| **En camino** | 🟡 Naranja | Delivery va hacia tu dirección |
| **Entregado** | 🟢 Verde | Pedido entregado exitosamente |
| **Cancelado** | 🔴 Rojo | Pedido cancelado |

---

## 👆 ¿Qué pasa cuando hace clic en un pedido?

### 1. Se abre un **MODAL** con detalles completos

```
┌─────────────────────────────────────┐
│  Detalles del Pedido                │
├─────────────────────────────────────┤
│                                     │
│  RESUMEN                            │
│  ─────────────────────────────────  │
│  Pedido #abc123                     │
│  13/12/2025                         │
│  Estado: En camino                  │
│  Total: S/. 45.99                   │
│                                     │
│  ITEMS ORDENADOS                    │
│  ─────────────────────────────────  │
│  ✓ Pizza Margarita x2 (Grande)      │
│  ✓ Gaseosa Coca Cola x1             │
│  ✓ Postre Flan x1                   │
│                                     │
│  DIRECCIÓN DE ENTREGA               │
│  ─────────────────────────────────  │
│  Calle Principal 123, Apto 4B       │
│  Instrucciones: Timbre azul         │
│                                     │
│  [VER RASTREO EN MAPA] (si está en) │
│  [CANCELAR] [CERRAR]                │
│                                     │
└─────────────────────────────────────┘
```

### 2. Información que ve en el modal

**Datos del Pedido:**
- ID
- Fecha y hora
- Estado actual
- Total con desglose

**Items Ordenados:**
- Nombre del producto
- Cantidad
- Tamaño/tipo (si aplica)
- Precio individual

**Dirección de Entrega:**
- Calle y número
- Apartamento/Detalles
- Instrucciones especiales

**Botones de Acciones:**
- "Ver Rastreo en Mapa" (solo si status = "en camino" y hay delivery asignado)
- "Cancelar Pedido" (si status = "pendiente")
- "Cerrar"

---

## 🗺️ ¿Cómo ve el tracking del pedido?

Si el estado es **"En camino"**:

### Desde el Modal:
1. Cliente hace clic en "Ver Rastreo en Mapa"
2. Se abre la página `/order-tracking/{orderId}`

### En la página de rastreo ve:
```
┌──────────────────────────────────┐
│     Rastreando tu pedido         │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   MAPA CON MAPBOX          │  │
│  │   📍 Cliente (rojo)        │  │
│  │   🚗 Delivery (verde)      │  │
│  │                            │  │
│  │   Distancia: 2.3 km        │  │
│  │   ETA: 15 minutos          │  │
│  └────────────────────────────┘  │
│                                  │
│  DETALLES DEL DELIVERY           │
│  ─────────────────────────────   │
│  Carlos López                    │
│  📞 +34 687 654 321              │
│  🚗 Moto Roja - ABC 123          │
│                                  │
│  [← Volver]                      │
│                                  │
└──────────────────────────────────┘
```

### Información disponible:
- **Mapa interactivo** (Mapbox)
- **Ubicación del cliente** (marcador rojo)
- **Ubicación del delivery** (marcador verde)
- **Distancia en km** (calculada en tiempo real)
- **ETA** (Estimated Time of Arrival - tiempo estimado)
- **Datos del delivery**:
  - Nombre
  - Teléfono (para contactar)
  - Placa/descripción del vehículo (si está disponible)

---

## 🔐 Requisitos para Acceder

Para ver sus pedidos, el cliente debe:

1. ✅ Estar **autenticado** (haber iniciado sesión)
2. ✅ Tener rol **"cliente"**
3. ✅ Tener al menos **1 pedido creado**

**Protección:** La página está protegida por `AuthGuard`, así que usuarios no autenticados no pueden acceder.

---

## 📱 Acceso desde diferentes dispositivos

### Web (navegador de escritorio):
- Abre `http://localhost:8100/pedidos`
- O navega desde el menú

### Móvil (Ionic App):
- Abre la app
- Busca "Mis Pedidos" en el menú lateral
- O toca el ícono de carrito/pedidos en la toolbar

---

## 🔄 Actualización Automática

La página **se actualiza automáticamente** cuando:

1. **Cliente realiza un nuevo pedido** → aparece en la lista
2. **Delivery acepta el pedido** → estado cambia a "En camino"
3. **Delivery marca como entregado** → estado cambia a "Entregado"
4. **Admin cancela un pedido** → estado cambia a "Cancelado"

Esto se logra con **Firestore listeners en tiempo real** usando `onSnapshot()`.

---

## 📊 Datos que se cargan

```javascript
// Cada pedido contiene:
{
  id: "abc123def456",
  total: 45.99,
  status: "en camino",
  createdAt: Timestamp,
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
      size: "grande"
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
  payment: { ... },
  deliveryPerson: {
    uid: "delivery456",
    displayName: "Carlos López",
    phone: "+34687654321"
  }
}
```

---

## 🐛 Troubleshooting

### Problema: "No tienes pedidos aún"
**Causa:** El usuario no ha creado ningún pedido  
**Solución:** Ir a inicio, agregar productos al carrito y hacer pedido

### Problema: Los pedidos no se actualizan
**Causa:** Firestore listener no está funcionando  
**Solución:** Revisar conexión a internet, recargar página

### Problema: No puedo ver el rastreo del pedido
**Causa:** El estado no es "en camino" o no hay delivery asignado  
**Solución:** Esperar a que un delivery acepte el pedido

### Problema: El mapa no carga
**Causa:** Token de Mapbox inválido  
**Solución:** Verificar token en [order-tracking.page.ts](src/app/pages/order-tracking/order-tracking.page.ts#L190)

---

## 📞 Resumen de Rutas Cliente

| Ruta | Descripción |
|------|------------|
| `/inicio` | Página de inicio, busca y agrega productos |
| `/productos` | Catálogo completo de pizzas |
| `/favoritos` | Productos guardados como favoritos |
| `/carrito` | Revisa y modifica orden antes de pagar |
| **/pedidos** | **VE SUS PEDIDOS** ← ESTÁS AQUÍ |
| `/order-tracking/{id}` | Rastreo en vivo del pedido con mapa |

---

**Última actualización:** 13 de diciembre, 2025
