import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss']
})
export class FavoriteButtonComponent implements OnInit, OnDestroy, OnChanges {
  @Input() productId = '';
  isFavorited = false;
  private unsub?: () => void;

  constructor(private favService: FavoriteService) {}

  ngOnInit(): void {
    this.subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']) this.subscribe();
  }

  private subscribe() {
    if (this.unsub) { try { this.unsub(); } catch {} this.unsub = undefined; }
    if (!this.productId) { this.isFavorited = false; return; }
    const u = this.favService.observeIsFavorited(this.productId, v => (this.isFavorited = !!v));
    this.unsub = () => { try { u(); } catch {} };
  }

  async toggleFavorite() {
    if (!this.productId) return;
    try {
      await this.favService.toggleFavorite(this.productId);
      // estado se actualizará por la suscripción en onSnapshot
    } catch (e) {
      console.error('[FavoriteButton] toggle error', e);
    }
  }

  ngOnDestroy(): void {
    if (this.unsub) { try { this.unsub(); } catch {} this.unsub = undefined; }
  }
}