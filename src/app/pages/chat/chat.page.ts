import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, ChatbotComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Multipizza - BOT</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <app-chatbot></app-chatbot>
    </ion-content>
  `
})
export class ChatPage {}
