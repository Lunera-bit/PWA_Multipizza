import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonFooter, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { ChatbotService } from '../../services/chatbot.service';
import { AddToCartComponent } from '../add-to-cart/add-to-cart.component';
import { sendOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';


interface ChatMessage {
  role: string;
  text?: string;
  type?: string;
  product?: any;
  products?: any[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonFooter, IonToolbar, IonIcon, AddToCartComponent],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  messages: ChatMessage[] = [];
  inputText = '';
  loading = false;
  sendIcon = sendOutline;
  isFirstMessage = true;
  selectedSize = 'personal';
  sizes = [
    { id: 'personal', label: 'Personal - S', multiplier: 1 },
    { id: 'mediana', label: 'Mediana - M', multiplier: 1.4 },
    { id: 'grande', label: 'Grande - L', multiplier: 1.6 },
    { id: 'familiar', label: 'Familiar - XL', multiplier: 1.8 }
  ];

  constructor(private chatbot: ChatbotService) {
    addIcons({ sendOutline });
  }

  async sendMessage() {
    if (!this.inputText.trim()) return;
    
    this.messages.push({ role: 'user', text: this.inputText });
    const query = this.inputText;
    this.inputText = '';
    this.loading = true;

    (await this.chatbot.sendMessage(query, this.isFirstMessage)).subscribe({
      next: (res) => {
        this.messages.push({ 
          role: 'bot', 
          type: res.type,
          text: res.text,
          product: res.product,
          products: res.products
        });
        this.isFirstMessage = false;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'bot', type: 'text', text: 'Error conectando al servidor X-X' });
        this.isFirstMessage = false;
        this.loading = false;
      }
    });
  }

  getProductPrice(basePrice: number): number {
    const multiplier = this.sizes.find(s => s.id === this.selectedSize)?.multiplier || 1;
    return Math.round(basePrice * multiplier * 10) / 10;
  }

  getSizeLabel(): string {
    return this.sizes.find(s => s.id === this.selectedSize)?.label || 'Personal - S';
  }

  onProductAdded() {
    // Aquí puedes hacer algo después de agregar al carrito
    console.log('Producto agregado al carrito');
  }
}
