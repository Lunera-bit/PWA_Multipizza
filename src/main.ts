import { addIcons } from 'ionicons';
import {
  homeOutline, pricetagOutline, flameOutline, cartOutline, notificationsOutline,
  person, alertCircleOutline, heartOutline, addOutline, removeOutline, heart,
  exit, starOutline, sadOutline, addCircleOutline, cart, settings, star, starHalf,
  logoOctocat,shareSocialOutline,shieldCheckmark
} from 'ionicons/icons';

import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Firebase (modular + compat)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from './environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

// icons
addIcons({
  'home-outline': homeOutline,
  'pricetag-outline': pricetagOutline,
  'cart-outline': cartOutline,
  'person': person,
  'cart': cart,
  'flame-outline': flameOutline,
  'notifications-outline': notificationsOutline,
  'alert-circle': alertCircleOutline,
  'heart-outline': heartOutline,
  'heart': heart,
  'exit': exit,
  'star-outline': starOutline,
  'star': star,
  'add-circle-outline': addCircleOutline,
  'add-outline': addOutline,
  'remove-outline': removeOutline,
  'sad-outline': sadOutline,
  'settings': settings,
  'star-half': starHalf,
  'logo-octocat': logoOctocat,
  'share-social-outline': shareSocialOutline,
  'shield-check': shieldCheckmark
});
const app = initializeApp(environment.firebase);

const analytics = getAnalytics(app);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Usa la instancia `app` creada arriba
    provideFirebaseApp(() => app),
    provideFirestore(() => getFirestore(app)),
    provideHttpClient(),
    provideAnimations()

  ]
}).catch(err => console.error(err));

