import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export interface ProductRecommendation {
  id: string;
  nombre: string;
  cantidad: number;
  razon: string;
}

export interface ChatbotResponse {
  reply: string;
  recommendations?: ProductRecommendation[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) {}

  async sendMessage(message: string): Promise<Observable<ChatbotResponse>> {
    const auth = getAuth();
    const user = auth.currentUser;
    const userName = await this.getUserName();
    
    return this.http.post<ChatbotResponse>(this.apiUrl, {
      message,
      userName: userName || 'Usuario',
      userId: user?.uid || null
    });
  }

  private async getUserName(): Promise<string | null> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return null;

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
