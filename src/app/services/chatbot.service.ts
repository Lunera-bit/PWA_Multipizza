import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) {}

  async sendMessage(message: string): Promise<Observable<{reply: string}>> {
    const userName = await this.getUserName();
    return this.http.post<{reply: string}>(this.apiUrl, {
      message,
      userName: userName || 'Usuario'
    });
  }

  private async getUserName(): Promise<string | null> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return null;

      // Obtiene el nombre de Firestore en la colección 'usuarios'
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data()?.['displayName'] || 'Usuario';
      }
      
      return 'Usuario';
    } catch (error) {
      console.error('Error obteniendo nombre de usuario:', error);
      return 'Usuario';
    }
  }

  private getApiUrl(): string {
    const host = window.location.hostname;
    return `http://${host}:5001/multipizza-1/us-central1/chatbot`;
  }
}