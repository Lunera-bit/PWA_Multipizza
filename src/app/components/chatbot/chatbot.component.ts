import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { ChatbotService } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonList, IonItem, IonLabel],
  template: `
    <div class="chat-container">
      <ion-list>
        <ion-item *ngFor="let msg of messages">
          <ion-label [class.user]="msg.role === 'user'" [class.bot]="msg.role === 'bot'">
            {{ msg.text }}
          </ion-label>
        </ion-item>
      </ion-list>
      
      <div class="input-area">
        <ion-input [(ngModel)]="inputText" placeholder="Escribe tu pregunta..."></ion-input>
        <ion-button (click)="sendMessage()" [disabled]="loading">
          {{ loading ? 'Cargando...' : 'Enviar' }}
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .user { color: blue; }
    .bot { color: green; }
    .input-area { display: flex; gap: 8px; padding: 16px; }
  `]
})
export class ChatbotComponent {
  messages: { role: string; text: string }[] = [];
  inputText = '';
  loading = false;

  constructor(private chatbot: ChatbotService) {}

  sendMessage() {
    if (!this.inputText.trim()) return;
    
    this.messages.push({ role: 'user', text: this.inputText });
    const query = this.inputText;
    this.inputText = '';
    this.loading = true;

    this.chatbot.sendMessage(query).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'bot', text: 'Error conectando al servidor' });
        this.loading = false;
      }
    });
  }
}