import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
  IonSpinner, IonCard, IonCardContent, IonIcon, ToastController,
  IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { PaypalService } from '../../services/paypal.service';
import { CartService } from '../../services/cart.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowBack } from 'ionicons/icons';
import { getFirestore, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

declare var paypal: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonButton, IonSpinner, IonCard, IonCardContent, 
    IonIcon, IonBackButton, IonButtons
  ],
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss']
})
export class PaymentPage implements OnInit, AfterViewInit {
  @ViewChild('paypalContainer') paypalContainer!: ElementRef;

  loadingScript = true;
  loadingButtons = false;
  paymentProcessing = false;
  paymentSuccess = false;
  paypalOrderId = '';
  orderData: any;
  scriptLoaded = false;

  constructor(
    private paypalService: PaypalService,
    private cart: CartService,
    private router: Router,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    addIcons({ checkmarkCircle, arrowBack });
    this.preloadPayPalScript();
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    
    if (navigation?.extras.state) {
      this.orderData = navigation.extras.state;
    } else {
      this.showToast('Error: No se encontraron datos del pedido');
      this.router.navigate(['/carrito']);
    }
  }

  ngAfterViewInit() {
    this.loadingScript = false;
    this.loadingButtons = true;
    
    setTimeout(() => {
      const container = document.getElementById('paypal-button-container');
      if (container) {
        if ((window as any).paypal) {
          this.renderPayPalButtons();
          this.loadingButtons = false;
        } else {
          this.waitForPayPal();
        }
      }
    }, 100);
  }

  private preloadPayPalScript() {
    if ((window as any).paypal) {
      this.loadingScript = false;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=AVID1fQErsLxWjsfqy09zjgtbEBJDcZS6ejSlWsRqGJuiuDb-XhQsHLMh8-vT91wZoamyrnDh6t9sJWd&currency=USD';
    script.async = true;

    script.onload = () => {
      this.scriptLoaded = true;
      this.loadingScript = false;
    };

    script.onerror = () => {
      this.loadingScript = false;
      this.showToast('Error cargando PayPal');
    };

    document.head.appendChild(script);
  }

  private waitForPayPal() {
    let attempts = 0;
    const maxAttempts = 50;

    const checkPayPal = setInterval(() => {
      attempts++;
      
      if ((window as any).paypal) {
        clearInterval(checkPayPal);
        this.renderPayPalButtons();
        this.loadingButtons = false;
      } else if (attempts >= maxAttempts) {
        clearInterval(checkPayPal);
        this.showToast('Error cargando PayPal - intenta recargar');
        this.loadingButtons = false;
      }
    }, 100);
  }

  private renderPayPalButtons() {
    if (!paypal) {
      return;
    }

    const container = document.getElementById('paypal-button-container');
    
    if (!container) {
      return;
    }

    container.innerHTML = '';

    try {
      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return this.paypalService.createOrder(
            this.orderData.total,
            `Pedido Multipizza - ${this.orderData.user.name}`
          ).toPromise().then((response: any) => {
            this.paypalOrderId = response.id;
            return response.id;
          }).catch((error: any) => {
            this.showToast('Error creando la orden de pago');
            throw error;
          });
        },
        onApprove: (data: any, actions: any) => {
          return this.paypalService.captureOrder(data.orderID).toPromise()
            .then((response: any) => {
              this.ngZone.run(() => {
                this.handlePaymentSuccess(response, data.orderID);
              });
            })
            .catch((error: any) => {
              this.showToast('Error procesando el pago');
            });
        },
        onError: (err: any) => {
          this.showToast('Error en el pago');
        }
      }).render(container);
    } catch (error) {
      // Error silencioso
    }
  }

  private async handlePaymentSuccess(response: any, paypalOrderId: string) {
    this.paymentProcessing = true;

    try {
      const paymentInfo = {
        method: this.getPaymentMethod(response),
        paypalOrderId: paypalOrderId,
        status: response.status,
        payer: response.payer?.email_address || 'N/A',
        amount: response.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || this.orderData.total
      };

      const completeOrder = {
        ...this.orderData,
        payment: paymentInfo,
        status: 'pendiente'
      };

      await this.saveOrderToFirebase(completeOrder);

      this.paymentSuccess = true;
      this.showToast('Pago realizado correctamente');
      this.cart.clearCart();

      setTimeout(() => {
        this.router.navigate(['/pedidos']);
      }, 3000);

    } catch (error) {
      this.showToast('Error guardando el pedido');
      this.paymentProcessing = false;
    }
  }

  private async saveOrderToFirebase(orderData: any): Promise<void> {
    const db = getFirestore();
    const orderId = await this.generateUniqueOrderId(db);

    await setDoc(doc(db, 'pedidos', orderId), {
      id: orderId,
      ...orderData,
      createdAt: serverTimestamp()
    });
  }

  private async generateUniqueOrderId(db: ReturnType<typeof getFirestore>, attempts = 6): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      const id = Math.floor(100000 + Math.random() * 900000).toString();
      const ref = doc(db, 'pedidos', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return id;
    }
    return `R${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  }

  private getPaymentMethod(response: any): string {
    const source = response.payment_source;
    if (source?.paypal) return 'PayPal';
    if (source?.card?.brand) return source.card.brand.toUpperCase();
    return 'Desconocido';
  }

  async goBack() {
    this.router.navigate(['/carrito']);
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({ 
      message, 
      duration: 2500, 
      position: 'bottom' 
    });
    await t.present();
  }
}