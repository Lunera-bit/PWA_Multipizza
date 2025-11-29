import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FooterComponent } from '../../components/footer/footer/footer.component';
import { FavoriteService } from '../../services/favorite.service';
import { ProductService, Product } from '../../services/product.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent]
})
export class FavoritosPage implements OnInit {

  favoriteProducts: Product[] = [];
  loading = true;
  uid: string = '';

  constructor(
    private favSvc: FavoriteService,
    private productSvc: ProductService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.loadFavorites();
  }

  async loadFavorites() {
    const user = await this.afAuth.currentUser;
    if (!user) return;
    this.uid = user.uid;

    // Obtener IDs de favoritos
    this.favSvc.getFavoriteIds(this.uid).subscribe({
      next: (favIds) => {
        const ids = favIds.map(f => f.id);

        // Obtener todos los productos
        this.productSvc.getProducts().subscribe(allProducts => {

          // Filtrar productos favoritos
          this.favoriteProducts = allProducts.filter(p => ids.includes(p.id!));

          this.loading = false;
        });
      }
    });
  }

  async toggleFavorite(productId: string) {
    await this.favSvc.toggleFavorite(productId);
    this.loadFavorites(); // refrescar lista
  }
}
