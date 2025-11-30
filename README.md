# PWA_Multipizza

Versión: v2.4.6
Fecha: 29 de noviembre de 2025

Descripción
- Aplicación híbrida PWA + nativa para pedidos de pizza.
- Funcionalidades principales: catálogo de pizzas, carrito, checkout con geolocalización (Mapbox), registros de pedidos en Firestore, página de "Mis Pedidos", y panel administrativo (CRUD pizzas/promociones, ver usuarios y pedidos).
- Próximas integraciones: método de pago PayPal, panel admin completo y reglas de seguridad en Firestore.

Índice
- Características
- Estructura del proyecto
- Requisitos
- Configuración de entorno
- Instalación y desarrollo
- Build y despliegue (PWA y nativo via Capacitor)
- Permisos nativos (GPS)
- Geolocalización y mapa
- Pedidos (UX y backend)
- Panel Admin (requerimientos)
- Integración PayPal (plan)
- Seguridad y reglas Firestore (ejemplo)
- Testing y recomendaciones
- Troubleshooting rápido
- Contribución
- Contacto

Características
- Carrito con gestión de cantidades y total.
- Checkout con uso de ubicación: usa Capacitor Geolocation en app nativa y navigator.geolocation en web.
- Mapa (Mapbox) que muestra marcador y centra la ubicación del cliente.
- Al confirmar pedido: guarda en Firestore, vacía el carrito y redirige a /pedidos.
- Página Mis Pedidos: lista pedidos del usuario autenticado, con estado y punto de color.
- Modal de detalle: muestra id, total, items (nombre, qty, precio), dirección y teléfono; permite cancelar pedido (confirmación).
- Panel admin (en desarrollo): CRUD pizzas, promociones; ver usuarios y pedidos; cambiar estado de pedidos.

Estructura principal (resumen)
- src/
  - app/
    - pages/
      - clientroute/      — checkout, mapa, geolocalización
      - pedidos/          — lista y detalle de pedidos
      - productos/        — catálogo de pizzas
      - admin/            — panel administrativo (pendiente/implementación)
      - login/, inicio/, carrito/, etc.
    - components/
      - footer/, header/, detallepedido/...
    - services/
      - cart.service.ts
      - auth.service.ts
      - api.service.ts (si existe)
    - models/
      - cart-item.model.ts
    - environments/
      - environment.ts
      - environment.prod.ts
- capacitor.config.ts
- angular.json
- package.json

Requisitos
- Node.js (recomendado 18+). Ver versión local con:
  - Windows PowerShell: `node -v`
- npm
- Ionic / Angular CLI (según flujo)
- Capacitor para builds nativos
- Cuenta Firebase (Firestore) y credenciales
- Mapbox token

Variables de entorno (editar en src/environments/*)
- firebase config: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
- mapboxToken: token Mapbox
- PAYPAL_CLIENT_ID (solo front en sandbox; crear backend para secret)
- Otros flags: environment-specific feature flags

Instalación local (Windows PowerShell)
```powershell
git clone <repo-url> .
npm install
# Desarrollar (web)
npm start
# o
ionic serve
# para uso local testin en mobiles
ionic serve --host 0.0.0.0 --port 8100 --external
```

Build y sincronización con Capacitor
```powershell
# Generar assets web
npm run build

# Sincronizar con plataformas nativas
npx cap sync

# Abrir Android Studio (Windows)
npx cap open android

# Abrir Xcode (macOS)
npx cap open ios
```

Permisos nativos (GPS)
- Android (android/app/src/main/AndroidManifest.xml):
  - <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  - <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
- iOS (ios/App/App/Info.plist):
  - NSLocationWhenInUseUsageDescription
  - NSLocationAlwaysAndWhenInUseUsageDescription
- Alternativa: solicitar permisos en tiempo de ejecución con `Geolocation.requestPermissions()`.

Geolocalización y mapa
- Nativo: `@capacitor/geolocation` → getCurrentPosition / watchPosition con enableHighAccuracy.
- Web: `navigator.geolocation` → getCurrentPosition / watchPosition (fallback).
- Mapbox: usa [lng, lat] para centrar y setMarker(lng, lat).
- Recomendaciones de precisión: usar watchPosition, esperar mejor accuracy, y parar cuando se alcanza targetAccuracy o tiempo máximo.

Pedidos (modelo y UX)
- Colección Firestore: `pedidos`
  - Campos sugeridos: user { uid, name, email, phone }, items [ { id, title, price, qty, type } ], address { street, details, coordinates }, total, status, createdAt
- Flujo:
  - Usuario confirma pago → orden creada en Firestore → vaciar carrito → redirigir a /pedidos
- Estado: `pendiente`, `en camino`, `entregado`, `cancelado`
- Mostrar en UI: ID (doc.id), monto en S/. (formateado), estado y punto de color según estado.
- Cancelación: actualizar campo `status` a `cancelado` tras confirmación del usuario.

Panel Admin (requerimientos)
- Autorización basada en rol `admin` (Firebase customClaims o campo role en users).
- Funcionalidades:
  - CRUD pizzas: colección `pizzas` (nombre, descripción, precio, imagen, categoría).
  - CRUD promociones.
  - Ver usuarios (colección `users`) y asignar roles.
  - Ver pedidos (colección `pedidos`) y cambiar estado.
- Seguridad: aplicar reglas Firestore para permitir solo admins escribir en `pizzas`, `promociones` y cambiar estados.

Integración PayPal — plan resumido
1. Crear cuenta desarrollador PayPal (sandbox) y obtener Client ID y Secret.
2. Backend seguro (Node/Express o Cloud Functions):
   - Endpoint POST /create-order → crea orden en PayPal y devuelve orderID al front.
   - Endpoint POST /capture-order → captura/valida pago y verifica respuesta de PayPal.
   - Guardar resultado validado en Firestore (marcar pedido `pagado`).
3. Front:
   - Cargar SDK PayPal (sandbox).
   - Crear flujo que llame a backend y capture pago.
4. Seguridad: nunca exponer Secret en frontend, siempre validar pagos en el servidor.

Ejemplo de endpoints (esqueleto) — implementar en servidor separado:
```javascript
const express = require('express');
const router = express.Router();
// POST /create-order 
// POST /capture-order 
module.exports = router;
```

Testing y recomendaciones
- Probar geolocalización en dispositivo físico (GPS real).
- Usar PayPal sandbox para pruebas de pago.
- Probar reglas de Firestore con emulador local antes de producción.
- Revisar bundle budgets y dependencias CommonJS (mapbox-gl puede requerir configuración adicional).

Troubleshooting rápido
- Error Capacitor: "Could not find the web assets directory: .\www" → ejecutar `npm run build` antes de `npx cap sync`.
- Errores de compilación Angular: revisar imports en páginas standalone (eliminar imports no usados como IonText) y corregir bindings en templates (`it.title` vs `it.name`).
- GPS con baja precisión: activar GPS, probar en exterior, aumentar timeouts o número de intentos en watchPosition.

Contribuir
1. Fork / crear rama feature/XXX
2. Hacer commits claros y PR con descripción y screenshots si aplica
3. Incluir pruebas y notas de testing

Comandos útiles
```powershell
npm install
npm run build
npm start            # dev server
npx cap sync
npx cap open android
git checkout -b feature/mi-feature
git tag -a v1.1.4 -m "v1.1.4: Mejora GPS, pedidos, detalle y cancelación"
git push origin v1.1.4
```
