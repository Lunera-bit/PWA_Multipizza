# PWA Multipizza - Sistema de Pedidos de Alimentos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-16+-DD0031?logo=angular)](https://angular.io/)
[![Ionic](https://img.shields.io/badge/Ionic-7+-3880FF?logo=ionic)](https://ionicframework.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-FFA500?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?logo=node.js)](https://nodejs.org/)

> Aplicación web progresiva (PWA) de gestión y pedidos de pizzas y alimentos.
---

## 📋 Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Guía de Desarrollo](#guía-de-desarrollo)
- [Servicios y APIs](#servicios-y-apis)
- [Componentes](#componentes)
- [Estructura de Datos](#estructura-de-datos)
- [Configuración Firebase](#configuración-firebase)
- [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
- [Seguridad](#seguridad)
- [Deployment](#deployment)
- [Solución de Problemas](#solución-de-problemas)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## 🎯 Descripción General

**PWA Multipizza** es una solución integral de e-commerce especializada en la gestión y distribución de alimentos, específicamente optimizada para pizzerías y establecimientos de comida rápida.

### Objetivos Principales

- ✓ Proporcionar una experiencia de usuario fluida y responsiva
- ✓ Implementar catálogo dinámico con gestión centralizada
- ✓ Facilitar el proceso de compra mediante interfaz intuitiva
- ✓ Garantizar accesibilidad offline mediante PWA
- ✓ Optimizar rendimiento y SEO
- ✓ Mantener escalabilidad en backend y frontend

---

## ✨ Características Principales

### Gestión de Catálogo

| Funcionalidad | Descripción |
|--------------|------------|
| **Catálogo Dinámico** | Sincronización en tiempo real con Firestore |
| **Categorización** | Organizaciónpor tipos: pizzas, complementos, bebidas |
| **Búsqueda Avanzada** | Filtrado por nombre, descripción, categoría y tags |
| **Sistema de Tags** | Clasificación flexible de productos |
| **Imágenes Optimizadas** | Carga desde Firebase Storage con caché |

### Experiencia de Compra

| Funcionalidad | Descripción |
|--------------|------------|
| **Carrito Persistente** | Almacenamiento en localStorage con sincronización |
| **Multiplicadores de Precio** | Ajuste automático según tamaño (S, M, L, XL) |
| **Redondeo de Precios** | Algoritmo de redondeo al 0.10 más cercano |
| **Sistema de Favoritos** | Guardado local de productos preferidos |
| **Compartir Productos** | Integración con redes sociales |

### Promociones y Marketing

| Funcionalidad | Descripción |
|--------------|------------|
| **Slider de Promociones** | Visualización destacada de ofertas |
| **Descuentos Dinámicos** | Gestión desde Firestore |
| **Validación de Fechas** | Control automático de vigencia |
| **Análisis de Conversión** | Seguimiento de promos efectivas |

### Características PWA

| Funcionalidad | Descripción |
|--------------|------------|
| **Instalable** | Instalación directa desde navegador |
| **Funciona Offline** | Acceso a contenido en modo desconectado |
| **Push Notifications** | Notificaciones de pedidos y promociones |
| **Responsiva** | Adaptación a cualquier dispositivo |

---

## 🛠 Stack Tecnológico

### Frontend

```
Angular 16+
├── Componentes Standalone
├── RxJS 7+ (Reactive Programming)
├── TypeScript 5+
└── Arquitectura Modular
```

### Mobile & UI

```
Ionic Framework 7+
├── Componentes pre-estilizados
├── Swiper para sliders
├── Ion-Icons para iconografía
└── Capacitor para APIs nativas
```

### Backend & Base de Datos

```
Firebase
├── Firestore (Base de datos NoSQL)
├── Cloud Storage (Almacenamiento de imágenes)
├── Authentication (Autenticación)
└── Cloud Functions (Lógica serverless)
```

### Herramientas de Desarrollo

```
- Node.js 16+
- npm / yarn
- Ionic CLI
- Capacitor
- TypeScript Compiler
- Webpack (bundler)
```

### Control de Versiones

```
- Git
- GitHub / GitLab
```

---

## 📋 Requisitos Previos

### Software Requerido

- **Node.js** v20.0.0 o superior
- **npm** v7.0.0 o superior (o yarn v1.22.0+)
- **Git** v2.20.0 o superior
- **Ionic CLI** v6.20.0 o superior

### Cuentas Necesarias

- Cuenta de **Firebase** (https://firebase.google.com)
- Cuenta de **GitHub** (opcional, para versionado)

### Configuración del Sistema

```bash
# Verificar versiones instaladas
node --version      # v20.0.0+
npm --version       # v7.0.0+
git --version       # v2.20.0+

# Instalar Ionic CLI globalmente
npm install -g @ionic/cli

# Verificar instalación
ionic --version
```

---

## 📦 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
# HTTPS
git clone https://github.com/Lunera-bit/PWA_Multipizza.git

# SSH
git clone git@github.com:Lunera-bit/PWA_Multipizza.git

# Navegar al directorio
cd PWA_Multipizza
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# O con yarn
yarn install

# Verificar instalación
npm list
```

### 3. Configurar Firebase

#### 3.1 Crear Proyecto en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Hacer clic en "Crear proyecto"
3. Ingresar nombre del proyecto: `multipizza-1`
4. Activar Google Analytics (opcional)
5. Crear proyecto

#### 3.2 Obtener Credenciales

1. En el proyecto, ir a **Configuración** (engranaje) → **Configuración del proyecto**
2. En la sección "Tus apps", hacer clic en **</>** (web)
3. Registrar app con nombre `PWA_Multipizza`
4. Copiar las credenciales Firebase

#### 3.3 Actualizar Archivo de Configuración

Editar `src/environments/environment.ts`:

```typescript
// filepath: src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "multipizza-1.firebaseapp.com",
    projectId: "multipizza-1",
    storageBucket: "multipizza-1.appspot.com",
    messagingSenderId: "TU_MESSAGING_ID_AQUI",
    appId: "TU_APP_ID_AQUI",
    measurementId: "TU_MEASUREMENT_ID_AQUI"
  }
};
```

### 4. Inicializar Firestore y Storage

```bash
# En Firebase Console:
# 1. Ir a Firestore Database → Crear base de datos
# 2. Seleccionar modo de prueba
# 3. Ir a Storage → Empezar
# 4. Aceptar reglas por defecto
```

### 5. Ejecutar Aplicación en Desarrollo

```bash
# Ejecutar servidor de desarrollo
ionic serve

# La app se abrirá en http://localhost:8100
```

---

## 🏗 Arquitectura del Proyecto

### Estructura de Directorios

```
Muy Pronto
```

### Patrón de Arquitectura

```
Muy pronto
```

---

## 🚀 Guía de Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
ionic serve                    # Ejecutar servidor en http://localhost:8100
ionic serve --lab             # Ejecutar con vista previa de múltiples dispositivos

# Compilación
ionic build                    # Build para desarrollo
ionic build --prod            # Build para producción (optimizado)
ionic build --release         # Build release

# Compilación para plataformas nativas
ionic capacitor add android   # Agregar soporte Android
ionic capacitor add ios       # Agregar soporte iOS
ionic capacitor build android # Compilar APK
ionic capacitor build ios     # Compilar IPA

# Pruebas
ng test                        # Ejecutar pruebas unitarias
ng e2e                         # Ejecutar pruebas E2E
```

### Crear Nuevos Componentes

```bash
# Crear componente standalone
ng generate component components/nuevo-componente --standalone

# Crear servicio
ng generate service services/nuevo-servicio

# Crear página
ng generate component pages/nueva-pagina --standalone
```

### Convenciones de Código

#### Nomenclatura

```typescript
// Componentes
export class MiComponentComponent { }

// Servicios
export class MiService { }

// Guards
export class MiGuard implements CanActivate { }

// Interfaces (PascalCase + singular)
interface Product { }
interface CartItem { }

// Enums
enum ProductCategory { PIZZA, BEBIDA }

// Constantes
const API_ENDPOINT = '/api/v1';
```

#### Estructura de Componente

```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './mi-componente.component.html',
  styleUrls: ['./mi-componente.component.scss']
})
export class MiComponenteComponent implements OnInit, OnDestroy {
  @Input() datos: any;
  @Output() evento = new EventEmitter<any>();

  private destroy$ = new Subject<void>();

  constructor(private miServicio: MiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.miServicio.obtener()
      .pipe(takeUntil(this.destroy$))
      .subscribe(/* ... */);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 🔧 Servicios y APIs

### ProductService

**Ubicación:** `src/app/services/product.service.ts`

Gestión centralizada de productos desde Firestore.

```typescript
// Obtener todos los productos
getProducts(): Observable<Product[]>

// Obtener producto por ID
getProductById(id: string): Observable<Product>

// Filtrar por categoría
getProductsByCategory(category: string): Observable<Product[]>

// Crear producto
createProduct(product: Product): Promise<string>

// Actualizar producto
updateProduct(id: string, product: Partial<Product>): Promise<void>

// Eliminar producto
deleteProduct(id: string): Promise<void>
```

### StorageService

**Ubicación:** `src/app/services/storage.service.ts`

Gestión de imágenes desde Firebase Storage con caché.

```typescript
// Obtener URL de una imagen
getImageUrl(imagePath: string): Promise<string>

// Obtener múltiples URLs en paralelo
getImageUrls(imagePaths: string[]): Promise<Map<string, string>>

// Subir imagen
uploadImage(file: File, path: string): Promise<string>

// Limpiar caché
clearCache(): void
```

#### Implementación en Componentes

```typescript
constructor(private storageService: StorageService) {}

async ngOnInit() {
  // Cargar URL de imagen
  this.producto.imagenUrl = await this.storageService
    .getImageUrl('pizzas/pepperoni.jpg');

  // Cargar múltiples imágenes
  const urls = await this.storageService.getImageUrls([
    'pizzas/pepperoni.jpg',
    'pizzas/hawaiana.jpg'
  ]);
}
```

### CartService

**Ubicación:** `src/app/services/cart.service.ts`

Gestión del carrito de compras con persistencia.

```typescript
// Agregar producto al carrito
addItem(item: CartItem): void

// Obtener carrito actual
getCart(): CartItem[]

// Obtener carrito como Observable
getCart$(): Observable<CartItem[]>

// Actualizar cantidad
updateQuantity(itemId: string, quantity: number): void

// Eliminar producto
removeItem(itemId: string): void

// Limpiar carrito
clearCart(): void

// Obtener total
getTotal(): number

// Obtener cantidad de items
getItemCount(): number
```

### InitService

**Ubicación:** `src/app/services/init.service.ts`

Inicialización automática de datos en Firestore.

```typescript
// Inicializar colecciones
async initializeData(): Promise<void>
```

Se ejecuta automáticamente en `main.ts`.

---

## 🧩 Componentes

### CategorySlidersComponent

**Ubicación:** `src/app/components/category-sliders/`

Muestra sliders horizontales de productos por categoría.

**Características:**
- Carga de imágenes con caché
- Swiper integrado para navegación fluida
- Responsive en todos los dispositivos
- Eventos de selección y favoritos

**Uso:**

```html
<app-category-sliders
  [categories]="['pizzas', 'bebidas', 'complementos']"
  [products]="products"
  [loading]="loading"
  (select)="onProductSelect($event)"
  (toggleFavorite)="onToggleFavorite($event)"
  (verMas)="onVerMas($event)">
</app-category-sliders>
```

### AddToCartComponent

**Ubicación:** `src/app/components/add-to-cart/`

Botón inteligente con selector de cantidad y tamaño.

**Características:**
- Cálculo automático de precios
- Redondeo al 0.10 más cercano
- Toast de confirmación
- Soporte para múltiples tamaños

**Uso:**

```html
<app-add-to-cart
  [item]="product"
  [selectedSize]="selectedSize"
  [sizeMultipliers]="{ personal: 1, mediana: 1.4, grande: 1.6, familiar: 1.8 }"
  (added)="onProductAdded()">
</app-add-to-cart>
```

### FavoriteButtonComponent

**Ubicación:** `src/app/components/favorite-button/`

Botón para agregar/quitar productos de favoritos.

**Uso:**

```html
<app-favorite-button
  [product]="product"
  [isFavorited]="isFavorited"
  (toggle)="onToggleFavorite()">
</app-favorite-button>
```

### PromoSliderComponent

**Ubicación:** `src/app/components/promo-slider/`

Slider de promociones destacadas.

**Uso:**

```html
<app-promo-slider
  [promos]="promos"
  [loading]="loadingPromos"
  (select)="onPromoSelect($event)"
  (verMas)="onPromoVerMas()">
</app-promo-slider>
```

---

## 📊 Estructura de Datos

### Modelo: Product

```typescript
interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  imagenUrl?: string;        // Generada desde Storage
  precio: number;
  categoria: 'pizzas' | 'complementos' | 'bebidas';
  tags?: string[];
  disponible?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Ejemplo en Firestore:**

```json
{
  "id": "doc_id_auto",
  "nombre": "Pepperoni",
  "descripcion": "Pizza clásica con pepperoni",
  "imagen": "pizzas/pepperoni.jpg",
  "precio": 20.1,
  "categoria": "pizzas",
  "tags": ["Clásico", "Carnes", "Favorita"],
  "disponible": true,
  "createdAt": "2024-11-29T10:30:00Z",
  "updatedAt": "2024-11-29T10:30:00Z"
}
```

### Modelo: CartItem

```typescript
interface CartItem {
  id: string;
  type: 'product' | 'promo';
  title: string;
  price: number;        // Precio final redondeado
  qty: number;
  size?: string;        // personal, mediana, grande, familiar
  meta?: Record<string, any>;
  addedAt?: Date;
}
```

### Modelo: Promocion

```typescript
interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  descuento: number;    // Porcentaje
  validaDesde: Timestamp;
  validaHasta: Timestamp;
  productosIds?: string[];
  activa?: boolean;
}
```

### Modelo: Size

```typescript
interface Size {
  id: string;
  label: string;
  multiplier: number;
}

// Valores predefinidos
const SIZES: Size[] = [
  { id: 'personal', label: 'Personal - S', multiplier: 1.0 },
  { id: 'mediana', label: 'Mediana - M', multiplier: 1.4 },
  { id: 'grande', label: 'Grande - L', multiplier: 1.6 },
  { id: 'familiar', label: 'Familiar - XL', multiplier: 1.8 }
];
```

---

## 🔥 Configuración Firebase

### Crear Base de Datos Firestore

1. En Firebase Console → **Firestore Database**
2. Crear base de datos en modo de prueba
3. Crear las siguientes colecciones:

#### Colección: `products`

```bash
# Crear documentos con esta estructura
{
  "categoria": "pizzas",
  "descripcion": "Descripción del producto",
  "imagen": "pizzas/pepperoni.jpg",
  "nombre": "Pepperoni",
  "precio": 20.1,
  "tags": ["Carnívoro", "Picante"],
  "disponible": true
}
```

#### Colección: `promos`

```bash
{
  "titulo": "Descuento especial",
  "descripcion": "Compra 2 y obtén 20% de descuento",
  "imagen": "promos/promo1.jpg",
  "descuento": 20,
  "validaDesde": "2024-11-29",
  "validaHasta": "2024-12-31",
  "activa": true
}
```

### Configurar Cloud Storage

1. En Firebase Console → **Storage**
2. Crear las siguientes carpetas:
   - `/pizzas` - Imágenes de pizzas
   - `/complementos` - Imágenes de complementos
   - `/bebidas` - Imágenes de bebidas
   - `/promos` - Imágenes de promociones

### Reglas de Seguridad Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de products a todos
    match /products/{document=**} {
      allow read;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Permitir lectura de promos a todos
    match /promos/{document=**} {
      allow read;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Carrito de usuario (privado)
    match /users/{userId}/cart/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Reglas de Seguridad Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura de imágenes a todos
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## ⚡ Optimizaciones de Rendimiento

### Caché de Imágenes

```typescript
// StorageService implementa caché automático
private urlCache = new Map<string, string>();

async getImageUrl(imagePath: string): Promise<string> {
  // Si está en caché, retornar inmediatamente
  if (this.urlCache.has(imagePath)) {
    return this.urlCache.get(imagePath) || '';
  }
  
  // Si no, cargar desde Storage y cachear
  const url = await getDownloadURL(ref(storage, imagePath));
  this.urlCache.set(imagePath, url);
  return url;
}
```

### Lazy Loading de Rutas

```typescript
// app.routes.ts
const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos.page').then(m => m.ProductosPage)
  }
];
```

### OnPush Change Detection

```typescript
@Component({
  selector: 'app-mi-componente',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiComponenteComponent { }
```

### TrackBy en *ngFor

```html
<!-- Mejorar rendimiento en listas largas -->
<div *ngFor="let product of products; trackBy: trackById">
  {{ product.nombre }}
</div>
```

```typescript
trackById(index: number, item: any): string {
  return item.id || index;
}
```

---

## 🔐 Seguridad

### Protección de Rutas

```typescript
// guards/auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    const isAuthenticated = !!localStorage.getItem('authToken');
    if (!isAuthenticated) {
      this.router.navigate(['/login']);
    }
    return isAuthenticated;
  }
}
```

### Validación en Cliente

```typescript
// Validar entrada de usuario
if (!email || !email.includes('@')) {
  throw new Error('Email inválido');
}

if (price < 0) {
  throw new Error('Precio no puede ser negativo');
}
```

### HTTPS en Producción

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  firebase: { /* ... */ },
  apiUrl: 'https://api.tu-dominio.com'
};
```

---

## 📦 Deployment

### Deployment a Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar proyecto
firebase init hosting

# Compilar para producción
ionic build --prod

# Desplegar
firebase deploy
```

### Compilar para Android

```bash
# Agregar plataforma
ionic capacitor add android

# Compilar
ionic capacitor build android

# Generar APK/AAB
# (Abre Android Studio y compila)
```

### Compilar para iOS

```bash
# Agregar plataforma
ionic capacitor add ios

# Compilar
ionic capacitor build ios

# Generar IPA
# (Abre Xcode y compila)
```

### Deployment a App Store

1. Generar certificados en Apple Developer
2. Configurar signing en Xcode
3. Crear build en Xcode
4. Enviar a App Store Connect

### Deployment a Google Play

1. Generar firma de Android
2. Crear APK/AAB firmado
3. Crear app en Google Play Console
4. Subir build

---

## 🐛 Solución de Problemas

### Las imágenes no se cargan

**Síntomas:** Imágenes sin cargar, solo se ve placeholder

**Solución:**

```bash
# 1. Verificar ruta en Firestore
# Debe estar en formato: pizzas/pepperoni.jpg

# 2. Verificar que exista en Firebase Storage
# Console → Storage → Ver carpeta correspondiente

# 3. Verificar reglas de seguridad Storage
# Debe permitir lectura pública

# 4. Abrir consola del navegador (F12)
# Buscar errores en Network tab
```

### El carrito no persiste

**Síntomas:** Carrito se vacía al recargar la página

**Solución:**

```typescript
// Verificar que localStorage está habilitado
if (typeof(Storage) !== "undefined") {
  localStorage.setItem('cart', JSON.stringify(items));
} else {
  console.error('localStorage no disponible');
}
```

### Firebase no se conecta

**Síntomas:** Error "Firebase not initialized"

**Solución:**

```bash
# 1. Verificar credenciales en environment.ts
# 2. Verificar conexión a internet
# 3. Verificar que Firestore está habilitado
# 4. Revisar reglas de seguridad
# 5. Limpiar caché del navegador
```

### Problemas de rendimiento

**Solución:**

```bash
# 1. Habilitar OnPush change detection
# 2. Usar trackBy en *ngFor
# 3. Implementar lazy loading de rutas
# 4. Optimizar tamaño de imágenes
# 5. Usar Angular DevTools para profiling
```

---

## 🤝 Contribuciones

### Política de Contribuciones

1. **Fork** el repositorio
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commit cambios: `git commit -am 'Add mi-feature'`
4. Push a rama: `git push origin feature/mi-feature`
5. Crear Pull Request

### Estándares de Código

- ✓ Seguir guía de estilos Angular
- ✓ Escribir pruebas unitarias
- ✓ Documentar funciones complejas
- ✓ Usar TypeScript strict mode
- ✓ Seguir convenciones de nombres

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver archivo `LICENSE` para más detalles.

```
MIT License

Permiso para usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del software.

Condición: Incluir aviso de copyright y licencia.
```

---

## 📧 Soporte y Contacto

### Reporte de Bugs

- Crear issue en GitHub con etiqueta `bug`
- Incluir descripción del problema
- Pasos para reproducir
- Versión de navegador/SO

### Solicitud de Funcionalidades

- Crear issue con etiqueta `enhancement`
- Describir funcionalidad deseada
- Casos de uso
---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Angular Documentation](https://angular.io/docs)
- [Ionic Framework](https://ionicframework.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tutoriales Recomendados

- [Angular Best Practices](https://angular.io/guide/styleguide)
- [RxJS Tutorial](https://rxjs.dev/guide/operators)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## 🎉 Agradecimientos

- [Angular Team](https://angular.io/)
- [Ionic Team](https://ionicframework.com/)
- [Firebase Community](https://firebase.google.com/)
- [Comunidad Open Source](https://opensource.org/)

---

## 📋 Changelog

### v2.4.6 (29/11/2025)

- ✓ Lanzamiento inicial
- ✓ Catálogo de pizzas y complementos
- ✓ Sistema de carrito
- ✓ Gestión de favoritos
- ✓ Integración Firebase
- ✓ PWA funcional

---

**Última actualización:** 29 de noviembre de 2025  
**Versión:** 2.4.6  
**Estado:** Producción ✓

---
