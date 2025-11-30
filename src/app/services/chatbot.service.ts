import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://127.0.0.1:5001/multipizza-1/us-central1/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<{reply: string}> {
    return this.http.post<{reply: string}>(this.apiUrl, {message});
  }
}