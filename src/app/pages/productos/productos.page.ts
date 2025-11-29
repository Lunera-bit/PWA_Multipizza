import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton, AlertController, ModalController } from '@ionic/angular/standalone';

import { FavoriteService } from '../../services/favorite.service';
import { ProductService } from '../../services/product.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'] ,
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton]
})
export class ProductosPage implements OnInit {

  uid = '123456'; // ← reemplazar por el uid REAL
  products: any[] = [];
  favorites: string[] = [];

  constructor(
    private productService: ProductService,
    private favService: FavoriteService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadFavorites();
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => {
      this.products = res;
    });
  }

  loadFavorites() {
    this.favService.getFavorites(this.uid).pipe(
      map(favs => favs.map(f => f.productId))
    ).subscribe(ids => {
      this.favorites = ids;
    });
  }

  toggleFav(productId: string, favorited: boolean) {
    if (favorited) {
      this.favService.setFavorite(this.uid, productId);
    } else {
      this.favService.removeFavorite(this.uid, productId);
    }
  }

  isFav(productId: string) {
    return this.favorites.includes(productId);
  }
}
