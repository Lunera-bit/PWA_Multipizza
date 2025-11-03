import { Component, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';

import { Subscription } from 'rxjs';
import { LoaderComponent } from './components/loader/loader.component';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, LoaderComponent],
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnDestroy {
  private sub: Subscription;
  private navStartTs = 0;
  private readonly MIN_VISIBLE_MS = 200; // evita parpadeos

  constructor(private router: Router, private loader: LoaderService) {
    // ocultar el loader cuando la navegación finalice o falle
    this.sub = this.router.events.subscribe((ev: Event) => {
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        const elapsed = Date.now() - (this.navStartTs || 0);
        const remaining = Math.max(0, this.MIN_VISIBLE_MS - elapsed);
        setTimeout(() => this.loader.hide(), remaining);
      }
    });
  }

  ngOnDestroy() {
    
    this.sub?.unsubscribe();
  }
}
