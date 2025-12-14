# Guía de Implementación - Sistema de Delivery y Tracking

## 📋 Descripción General

Se ha implementado un sistema completo de gestión de pedidos para delivery con seguimiento en tiempo real utilizando Mapbox. El sistema incluye:

- **Página de Delivery**: Permite a los repartidores aceptar pedidos disponibles y cambiar el estado de los pedidos
- **Página de Tracking**: Permite a los clientes ver la ubicación del delivery, distancia y tiempo estimado de entrega
- **Servicio de Tracking**: Gestiona la ubicación en tiempo real del delivery y cálculos de distancia

## 🚀 Características Implementadas

### 1. **Página de Delivery (`/delivery-pedidos`)**
   - Ver lista de pedidos disponibles (sin asignar)
   - Aceptar pedidos y comenzar seguimiento
   - Ver lista de pedidos aceptados
   - Marcar pedidos como entregados
   - Interfaz con dos tabs: "Disponibles" y "Mis Pedidos"

### 2. **Página de Order Tracking (`/order-tracking/:orderId`)**
   - Mapa interactivo con Mapbox
   - Ubicación en tiempo real del delivery
   - Información del repartidor (nombre, foto, teléfono)
   - Distancia y tiempo estimado
   - Detalles del pedido y dirección
   - Botón para llamar al delivery

### 3. **Servicio de Tracking (`tracking.service.ts`)**
   - Iniciar/detener seguimiento de ubicación
   - Obtener ubicación del dispositivo
   - Escuchar cambios de ubicación en tiempo real
   - Calcular distancia (Fórmula Haversine)
   - Estimar tiempo de entrega

## 📦 Archivos Creados/Modificados

### Archivos Nuevos:
```
src/app/services/tracking.service.ts
src/app/pages/delivery-pedidos/
  ├── delivery-pedidos.page.ts
  ├── delivery-pedidos.page.html
  └── delivery-pedidos.page.scss
src/app/pages/order-tracking/
  ├── order-tracking.page.ts
  ├── order-tracking.page.html
  └── order-tracking.page.scss
```

### Archivos Modificados:
```
src/app/models/orden.model.ts (agregados DeliveryPerson, deliveryPerson, acceptedAt)
src/app/models/user.model.ts (agregado rol 'delivery')
src/app/services/orden.service.ts (nuevos métodos para delivery)
src/app/app.routes.ts (nuevas rutas)
src/app/guards/role.guard.ts (soporte para rol 'delivery')
```

## ⚙️ Configuración Requerida

### 1. **Mapbox Token**
El servicio de tracking utiliza Mapbox para mostrar el mapa. Necesitas:

1. Crear una cuenta en [Mapbox](https://www.mapbox.com/)
2. Obtener tu access token
3. En `order-tracking.page.ts`, línea ~240, reemplazar:
   ```typescript
   const mapboxToken = 'tu_token_aqui';
   ```

### 2. **Permisos de Geolocalización**
Asegúrate de que el archivo `capacitor.config.ts` incluya:
```json
{
  "plugins": {
    "Geolocation": {
      "permissions": {
        "location": "whenInUse"
      }
    }
  }
}
```

### 3. **Firebase Firestore**
Estructura de colecciones requeridas:

#### `pedidos` collection:
```typescript
{
  id: string;
  address: {
    coordinates: { lat: number; lng: number };
    street: string;
    details?: string;
    instructions?: string;
  };
  items: Array<{
    id: string;
    title: string;
    price: number;
    qty: number;
    size?: string;
    type?: string;
  }>;
  payment: { /* ... */ };
  status: 'pendiente' | 'en camino' | 'entregado' | 'cancelado';
  total: number;
  user: { uid: string; name: string; email: string; phone: string };
  deliveryPerson?: {
    uid: string;
    displayName: string;
    photoURL?: string;
    currentLocation?: { lat: number; lng: number };
    phone?: string;
  };
  acceptedAt?: timestamp;
  estimatedDeliveryTime?: number;
  notes?: string;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

#### `usuarios` collection:
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  rol: 'cliente' | 'admin' | 'delivery';
  createdAt: timestamp;
  lastLogin?: timestamp;
}
```

## 🔐 Reglas de Seguridad (Firestore)

Añade estas reglas a tu Firestore para permitir que los delivery actualicen sus ubicaciones:

```firestore
match /pedidos/{document=**} {
  allow read: if request.auth != null;
  
  // Delivery puede actualizar su ubicación y estado
  allow update: if request.auth != null && 
    get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'delivery' &&
    request.resource.data.deliveryPerson.uid == request.auth.uid;
  
  // Admin puede crear y actualizar
  allow create, update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}

match /usuarios/{document=**} {
  allow read: if request.auth != null && request.auth.uid == resource.id;
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

## 🎯 Flujo de Uso

### Para Delivery:
1. Usuario con rol "delivery" accede a `/delivery-pedidos`
2. Ve pedidos disponibles (no asignados)
3. Acepta un pedido → se inicia seguimiento de ubicación
4. El cliente puede ver la ubicación en tiempo real
5. Delivery marca como entregado → se detiene seguimiento

### Para Cliente:
1. Cliente realiza un pedido
2. Estado inicial: "pendiente"
3. Cuando un delivery acepta → estado cambia a "en camino"
4. Cliente puede acceder a `/order-tracking/{orderId}` para ver:
   - Mapa con ubicación del delivery
   - Distancia y tiempo estimado
   - Información del repartidor
   - Botón para llamar

## 📍 Cálculo de Distancia

Se utiliza la **Fórmula Haversine** para calcular distancia entre dos puntos GPS:
- Actualización cada 10 segundos
- Distancia en kilómetros
- Tiempo estimado basado en 30 km/h de velocidad promedio

## 🚨 Notas Importantes

1. **Ubicación en Tiempo Real**: El seguimiento se actualiza cada 10 segundos. Puedes ajustar este intervalo en `tracking.service.ts` (línea ~66)

2. **Token de Mapbox**: NO incluyas el token en el código de producción. Usa variables de entorno.

3. **Permisos**: En iOS y Android, los usuarios deben otorgar permisos de ubicación.

4. **Batería**: El seguimiento continuo consume batería. Considera mostrar una notificación o advertencia al usuario.

5. **Precisión de GPS**: La precisión depende de la cobertura de GPS. En interiores puede ser menos preciso.

## 🔧 Personalización

### Ajustar intervalo de actualización:
En `tracking.service.ts`, línea ~66:
```typescript
}, 10000) as any; // Cambiar 10000 (ms) a tu valor deseado
```

### Cambiar velocidad estimada:
En `tracking.service.ts`, línea ~155:
```typescript
const averageSpeed = 30; // Cambiar a tu velocidad promedio
```

### Estilo del mapa:
En `order-tracking.page.ts`, línea ~245:
```typescript
style: 'mapbox://styles/mapbox/streets-v12', // Cambiar a otro estilo
```

## 🐛 Solución de Problemas

### "Mapbox token invalid"
- Verifica que hayas reemplazado el token correctamente
- Verifica que tu token sea válido en Mapbox

### "No se actualiza la ubicación"
- Verifica que el usuario haya otorgado permisos de ubicación
- Comprueba que haya cobertura GPS
- Revisa la consola del navegador para errores

### "No se muestra el mapa"
- Verifica que Mapbox se haya cargado correctamente
- Comprueba que las coordenadas sean válidas (lat/lng válidos)
- Asegúrate de que el contenedor del mapa tenga altura (350px)

## 📚 Referencias

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Capacitor Geolocation](https://capacitorjs.com/docs/apis/geolocation)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

## ✅ Próximos Pasos Sugeridos

1. Integrar notificaciones push cuando se acepta un pedido
2. Agregar historial de ubicación
3. Implementar sistema de calificación para delivery
4. Agregar soporte offline para el mapa
5. Implementar ruta optimizada entre múltiples entregas
6. Agregar sensor de batería para advertencias
7. Implementar chat en tiempo real entre cliente y delivery
