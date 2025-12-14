# 🔐 SEGURIDAD - Token de Mapbox en Producción

## ⚠️ IMPORTANTE: NO dejes el token en el código

El token de Mapbox que ves en `order-tracking.page.ts` es un placeholder. 
Aquí te mostramos cómo hacerlo correctamente en producción.

---

## ❌ INCORRECTO (NUNCA hagas esto)

```typescript
// ❌ MAL - Token expuesto en el código
const mapboxToken = 'pk.eyJ1IjoibHVpcGFsb21pIiwiYSI6ImNseW5iNXZvMzJhMGcycXBuN3lrMGUxcmYifQ.tLk8vhKOZA_VNzd5V9c9Vw';
```

---

## ✅ OPCIÓN 1: Variables de Entorno (RECOMENDADO)

### Paso 1: Crear archivos de entorno

`src/environments/environment.ts` (desarrollo):
```typescript
export const environment = {
  production: false,
  firebaseConfig: { /* ... */ },
  mapbox: {
    accessToken: 'pk.tu_token_desarrollo'
  }
};
```

`src/environments/environment.prod.ts` (producción):
```typescript
export const environment = {
  production: true,
  firebaseConfig: { /* ... */ },
  mapbox: {
    accessToken: 'pk.tu_token_produccion' // Diferente token por seguridad
  }
};
```

### Paso 2: Actualizar order-tracking.page.ts

```typescript
import { environment } from '../../../environments/environment';

private createMap() {
  if (!this.mapContainer || !this.order?.address?.coordinates) return;

  const mapboxgl = (window as any).mapboxgl;
  
  // Usar token de entorno
  mapboxgl.accessToken = environment.mapbox.accessToken;
  
  // ... resto del código
}
```

---

## ✅ OPCIÓN 2: Backend API (MÁS SEGURO)

Si tienes un backend (Node.js/Firebase Cloud Functions):

### Paso 1: Crear Cloud Function

`functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';

export const getMapboxToken = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  // Retornar token desde variables de entorno
  return {
    token: process.env.MAPBOX_TOKEN
  };
});
```

### Paso 2: Actualizar order-tracking.page.ts

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

private async getMapboxToken(): Promise<string> {
  try {
    const functions = getFunctions();
    const getToken = httpsCallable(functions, 'getMapboxToken');
    const result = await getToken({});
    return (result.data as any).token;
  } catch (error) {
    console.error('Error getting mapbox token:', error);
    throw error;
  }
}

private async createMap() {
  if (!this.mapContainer || !this.order?.address?.coordinates) return;

  const mapboxToken = await this.getMapboxToken();
  
  const mapboxgl = (window as any).mapboxgl;
  mapboxgl.accessToken = mapboxToken;
  
  // ... resto del código
}
```

### Paso 3: Configurar variable de entorno en Firebase

```bash
firebase functions:config:set mapbox.token="pk.tu_token_produccion"
```

---

## ✅ OPCIÓN 3: Restricción de Tokens en Mapbox

Usa la consola de Mapbox para restringir cada token:

1. Accede a [Mapbox Tokens](https://account.mapbox.com/tokens)
2. Crea un token nuevo para cada ambiente
3. En cada token, configura:
   - **URL Restrictions**: Solo tu dominio
   - **Scopes**: Solo `styles:read`, `geospatial:read`
   - **Data Restrictions**: Público y tus datasets privados

Ejemplo de restricción:
```
Allowed URLs:
- https://tuapp.com
- https://*.tuapp.com
- http://localhost:4200 (desarrollo)

No permitir:
- *

Expira: Establecer fecha de expiración
```

---

## 🔑 Obtener Token de Mapbox

1. Ve a [Mapbox Signup](https://www.mapbox.com/)
2. Crea una cuenta gratuita
3. Accede al [Dashboard](https://account.mapbox.com/)
4. En "Tokens" → "Create a token"
5. Nombre: `multipizza-prod` (o `multipizza-dev`)
6. Scopes recomendados:
   - `styles:read`
   - `geospatial:read`
7. Copia el token (empieza con `pk.`)
8. Configura restricciones de URL

---

## 🔄 Rotación de Tokens

Recomendado cada 6-12 meses:

```bash
# 1. Crear token nuevo en Mapbox Console
# 2. Actualizar en Firebase Functions Config
firebase functions:config:set mapbox.token="pk.nuevo_token"

# 3. Deploy
firebase deploy --only functions

# 4. Esperar confirmación
# 5. Revocar token antiguo en Mapbox Console
```

---

## 📊 Límites Gratuitos de Mapbox

- **200,000** vistas de mapa por mes
- **50,000** peticiones a API de geocodificación
- **10,000** elementos interactivos

Para producción, considera plan pagado.

---

## ✅ Checklist de Seguridad

- [ ] Token no está en el código fuente
- [ ] Token está en variables de entorno o backend
- [ ] URL restrictions configuradas en Mapbox
- [ ] Diferentes tokens por ambiente
- [ ] Token tiene expira configurada
- [ ] Scopes limitados al mínimo necesario
- [ ] Acceso a Cloud Functions restringido a usuarios autenticados
- [ ] Logs monitoreados en Firebase
- [ ] Plan de rotación de tokens

---

## 🚨 Si se expone el token

1. Ve a [Mapbox Tokens](https://account.mapbox.com/tokens)
2. Busca el token comprometido
3. Clic en el menú → "Revoke"
4. Crear token nuevo inmediatamente
5. Actualizar en tu aplicación
6. Verificar logs de uso anómalo

---

## 📞 Soporte

- Mapbox Docs: https://docs.mapbox.com/
- Firebase Docs: https://firebase.google.com/docs
- Security Best Practices: https://cheatsheetseries.owasp.org/

