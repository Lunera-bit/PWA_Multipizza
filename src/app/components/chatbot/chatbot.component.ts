import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonFooter, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { ChatbotService } from '../../services/chatbot.service';
import { FooterComponent } from '../footer/footer/footer.component';
import { sendOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonFooter, IonToolbar, IonIcon, FooterComponent],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  messages: { role: string; text: string }[] = [];
  inputText = '';
  loading = false;
  sendIcon = sendOutline;

  constructor(private chatbot: ChatbotService) {
    addIcons({ sendOutline });
  }

  async sendMessage() {
    if (!this.inputText.trim()) return;
    
    this.messages.push({ role: 'user', text: this.inputText });
    const query = this.inputText;
    this.inputText = '';
    this.loading = true;

    (await this.chatbot.sendMessage(query)).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'bot', text: 'Error conectando al servidor X-X' });
        this.loading = false;
      }
    });
  }
}
