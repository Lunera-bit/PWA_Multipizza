# 🚀 QUICK START - Sistema de Delivery

## ⚡ 3 Pasos para Activar

### 1. **Configurar Mapbox Token**
Abre: `src/app/pages/order-tracking/order-tracking.page.ts`

Busca la línea ~240:
```typescript
const mapboxToken = 'tu_token_aqui';
```

Reemplaza con tu token de [Mapbox](https://www.mapbox.com/):
```typescript
const mapboxToken = 'pk.tu_token_personal_aqui';
```

### 2. **Agregar rol "delivery" en Firestore**
En la colección `usuarios`, edita un usuario y agrega:
```json
{
  "uid": "user123",
  "email": "delivery@example.com",
  "displayName": "Juan García",
  "rol": "delivery"
}
```

### 3. **Acceder a las páginas**
- **Para Delivery:** `http://localhost:8100/delivery-pedidos`
- **Para Cliente:** `http://localhost:8100/order-tracking/{orderId}`

---

## 📦 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `tracking.service.ts` | Geolocalización y distancia |
| `delivery-pedidos/` | Página del repartidor |
| `order-tracking/` | Página de tracking del cliente |
| `orden.model.ts` | Modelos de datos actualizados |

---

## 🧪 Testing Local

```bash
# Instalar dependencias
npm install

# Ejecutar servidor local
ionic serve

# Emular en dispositivo (opcional)
ionic capacitor build
```

---

## 🎯 Flujo de Prueba

1. **Crear un pedido** (como cliente)
   - Accede a `/carrito` → completa compra
   - Status: `pendiente`

2. **Aceptar como delivery**
   - Accede a `/delivery-pedidos` (con rol delivery)
   - Clic en "Aceptar Pedido"
   - Se inicia geolocalización

3. **Ver tracking** (como cliente)
   - Accede a `/order-tracking/{orderId}`
   - Ver mapa con ubicación en tiempo real
   - Distancia y tiempo estimado

4. **Marcar entregado**
   - En `/delivery-pedidos` → "Marcar Entregado"
   - Status: `entregado`

---

## 📍 Coordenadas de Prueba

```
Santiago: -33.8688, -70.6693
Providencia: -33.4274, -70.6086
Vitacura: -33.3872, -70.5889
Las Condes: -33.4211, -70.5898
```

---

## 🔧 Comandos Útiles

```bash
# Compilar
npm run build

# Verificar errores
ng lint

# Ver cambios en Firestore
# Consola de Firebase → Realtime Database → pedidos
```

---

## 📚 Documentación Completa

Ver archivos en la raíz del proyecto:
- `README_DELIVERY.md` - Documentación completa
- `DELIVERY_SETUP.md` - Configuración detallada
- `DELIVERY_EXAMPLES.ts` - Ejemplos de código
- `MENU_INTEGRATION.ts` - Integración con menú

---

## ⚠️ Problemas Comunes

### "Mapbox no aparece"
- Verificar token válido en `order-tracking.page.ts`
- Revisar consola del navegador (F12)

### "Ubicación no se actualiza"
- Otorgar permisos de geolocalización al navegador
- Comprobar que el dispositivo tenga GPS/conexión

### "Pedidos no aparecen"
- Verificar que el documento tenga campo `status: 'pendiente'`
- Revisar colección en Firebase Console

---

## ✅ Checklist Antes de Producción

- [ ] Configurar token de Mapbox
- [ ] Agregar usuarios con rol "delivery"
- [ ] Configurar Firestore Rules
- [ ] Probar en dispositivo real
- [ ] Verificar permisos de ubicación
- [ ] Revisar estados de pedidos
- [ ] Probar notificaciones (si aplica)
- [ ] Revisar seguridad en Firestore

---

**¿Necesitas ayuda?** Revisar documentación en archivos `.md`
