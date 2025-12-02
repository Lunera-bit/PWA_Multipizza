import { Injectable } from '@angular/core';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private urlCache = new Map<string, string>();
  private readonly CACHE_KEY = 'image_urls_cache';
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.loadCacheFromStorage();
  }

  async getImageUrl(imagePath: string): Promise<string> {
    if (!imagePath) return '';

    // 1. Verificar en memoria (más rápido)
    if (this.urlCache.has(imagePath)) {
      return this.urlCache.get(imagePath) || '';
    }

    // 2. Verificar en LocalStorage
    const cachedUrl = this.getCachedUrl(imagePath);
    if (cachedUrl) {
      this.urlCache.set(imagePath, cachedUrl);
      return cachedUrl;
    }

    // 3. Obtener de Firebase Storage
    try {
      const storage = getStorage();
      const imageRef = ref(storage, imagePath);
      const url = await getDownloadURL(imageRef);
      
      // Guardar en memoria y LocalStorage
      this.urlCache.set(imagePath, url);
      this.saveUrlToStorage(imagePath, url);
      
      return url;
    } catch (error) {
      console.error(`Error obteniendo URL para ${imagePath}:`, error);
      return '';
    }
  }

  // Obtener múltiples URLs (más eficiente)
  async getImageUrls(imagePaths: string[]): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    
    const promises = imagePaths.map(async (path) => {
      const url = await this.getImageUrl(path);
      urls.set(path, url);
    });

    await Promise.all(promises);
    return urls;
  }

  // Guardar URL en LocalStorage
  private saveUrlToStorage(imagePath: string, url: string): void {
    try {
      const cache = this.getStorageCache();
      cache[imagePath] = {
        url,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  // Obtener URL del LocalStorage si no ha expirado
  private getCachedUrl(imagePath: string): string | null {
    try {
      const cache = this.getStorageCache();
      const cached = cache[imagePath];
      
      if (!cached) return null;

      // Verificar si ha expirado
      if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
        delete cache[imagePath];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached.url;
    } catch (error) {
      console.error('Error leyendo del localStorage:', error);
      return null;
    }
  }

  // Obtener caché completo
  private getStorageCache(): Record<string, any> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  // Cargar caché en memoria al inicializar
  private loadCacheFromStorage(): void {
    try {
      const cache = this.getStorageCache();
      Object.entries(cache).forEach(([path, data]: [string, any]) => {
        if (data.url && Date.now() - data.timestamp <= this.CACHE_EXPIRY) {
          this.urlCache.set(path, data.url);
        }
      });
    } catch (error) {
      console.error('Error cargando caché:', error);
    }
  }

  // Limpiar caché
  clearCache(): void {
    this.urlCache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  // Limpiar caché expirado
  clearExpiredCache(): void {
    const cache = this.getStorageCache();
    Object.entries(cache).forEach(([path, data]: [string, any]) => {
      if (Date.now() - data.timestamp > this.CACHE_EXPIRY) {
        delete cache[path];
        this.urlCache.delete(path);
      }
    });
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
  }
}