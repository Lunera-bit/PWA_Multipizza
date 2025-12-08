import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonFooter, IonToolbar, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, ToastController } from '@ionic/angular/standalone';
import { ChatbotService, ProductRecommendation } from '../../services/chatbot.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { FooterComponent } from '../footer/footer/footer.component';
import { sendOutline, cartOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonFooter,
    IonToolbar,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    FooterComponent
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  messages: { role: string; text: string; recommendations?: ProductRecommendation[] }[] = [];
  inputText = '';
  loading = false;
  sendIcon = sendOutline;
  cartIcon = cartOutline;

  constructor(
    private chatbot: ChatbotService,
    private cartService: CartService,
    private productService: ProductService,
    private toastCtrl: ToastController
  ) {
    addIcons({ sendOutline, cartOutline });
  }

  async sendMessage() {
    if (!this.inputText.trim()) return;

    this.messages.push({ role: 'user', text: this.inputText });
    const query = this.inputText;
    this.inputText = '';
    this.loading = true;

    (await this.chatbot.sendMessage(query)).subscribe({
      next: (res) => {
        const reply = res.reply || '';

        // buscar JSON de recomendaciones en la respuesta
        const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
        let recommendations: ProductRecommendation[] | undefined;

        if (jsonMatch && jsonMatch[1]) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (jsonData.type === 'recommendation' && jsonData.products) {
              recommendations = jsonData.products;
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }

        // limpiar la respuesta de texto sin el JSON
        const cleanReply = reply.replace(/```json[\s\S]*?```/g, '').trim();

        this.messages.push({
          role: 'bot',
          text: cleanReply,
          recommendations: recommendations
        });

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'bot', text: 'Error conectando al servidor X-X' });
        this.loading = false;
      }
    });
  }

  async addSingleRecommendation(rec: ProductRecommendation) {
    try {
      const product = await this.productService.getProductById(rec.id).toPromise();

      if (product) {
        this.cartService.addItem({
          id: rec.id,
          type: 'product',
          title: rec.nombre,
          price: product.precio || 0,
          qty: rec.cantidad,
          size: 'personal'
        });

        const toast = await this.toastCtrl.create({
          message: `${rec.nombre} añadido al carrito`,
          duration: 1500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al añadir al carrito',
        duration: 1500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async addAllRecommendationsToCart(recommendations: ProductRecommendation[]) {
    if (!recommendations || recommendations.length === 0) return;

    let addedCount = 0;
    let failedCount = 0;

    for (const rec of recommendations) {
      try {
        const product = await this.productService.getProductById(rec.id).toPromise();

        if (product) {
          this.cartService.addItem({
            id: rec.id,
            type: 'product',
            title: rec.nombre,
            price: product.precio || 0,
            qty: rec.cantidad,
            size: 'personal'
          });
          addedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('Error añadiendo producto:', error);
        failedCount++;
      }
    }

    // mostrar toast con resultado
    const message =
      failedCount > 0
        ? `Se añadieron ${addedCount} productos. ${failedCount} fallaron.`
        : `Se añadieron ${addedCount} productos al carrito`;

    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: failedCount > 0 ? 'warning' : 'success'
    });
    await toast.present();
  }
}
