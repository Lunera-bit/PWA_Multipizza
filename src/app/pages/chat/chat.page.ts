import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { HeaderComponent } from '../../components/header/header/header.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, notificationsOutline } from 'ionicons/icons';
import { FooterComponent } from '../../components/footer/footer/footer.component';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    ChatbotComponent, 
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss']
})
export class ChatPage implements OnInit, OnDestroy {
  carritoCount = 0;
  notificacionesCount = 0;
  cartIcon = 'cart-outline';
  cartPulse = false;
  private cartSub?: Subscription;
  private _prevCartCount = 0;

  constructor(private router: Router, private cart: CartService) {
    addIcons({ cartOutline, notificationsOutline });
  }

  ngOnInit(): void {
    // suscribir al carrito para mostrar la badge con total de items (qty)
    this.cartSub = this.cart.cart$?.subscribe((items: any[]) => {
      const total = (items || []).reduce((s, it) => s + (it.qty || 0), 0);
      // pulse si se incrementó
      if (total > this._prevCartCount) {
        this.cartPulse = true;
        setTimeout(() => (this.cartPulse = false), 700);
      }
      this._prevCartCount = total;
      this.carritoCount = total;
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  openCart() {
    void this.router.navigate(['/carrito']);
  }

  openBandeja() {
    void this.router.navigate(['/notificaciones']);
  }
}
