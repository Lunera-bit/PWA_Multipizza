import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-favorite', // selector usado en las plantillas
  standalone: true,
  imports: [IonicModule],
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss']
})
export class FavoriteButtonComponent {
  @Input() favorited = false;
  @Output() toggle = new EventEmitter<boolean>();

  onToggle(ev?: Event) {
    ev?.stopPropagation();
    this.favorited = !this.favorited;
    this.toggle.emit(this.favorited);
  }
}