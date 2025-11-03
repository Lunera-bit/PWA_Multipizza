import { addIcons } from 'ionicons';
import {
  homeOutline, pricetagOutline, flameOutline, cartOutline, notificationsOutline,
  person, alertCircleOutline, heartOutline, addOutline, removeOutline, heart,
  exit, starOutline, sadOutline, addCircleOutline, cart, settings, star, starHalf,
  logoOctocat
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
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from './environments/environment';

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
  'logo-octocat': logoOctocat
});

bootstrapApplication(AppComponent, {
  providers: [
    // compat (provee angularfire2.app.options para AngularFireAuth compat)
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule
    ),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // modular providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ]
}).catch(err => console.error(err));

