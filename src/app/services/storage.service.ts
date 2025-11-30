import { Injectable } from '@angular/core';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private urlCache = new Map<string, string>();

  async getImageUrl(imagePath: string): Promise<string> {
    if (!imagePath) return '';

    // Si ya está en caché, retornar desde caché
    if (this.urlCache.has(imagePath)) {
      return this.urlCache.get(imagePath) || '';
    }

    try {
      const storage = getStorage();
      const imageRef = ref(storage, imagePath);
      const url = await getDownloadURL(imageRef);
      
      // Guardar en caché
      this.urlCache.set(imagePath, url);
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

  clearCache(): void {
    this.urlCache.clear();
  }
}