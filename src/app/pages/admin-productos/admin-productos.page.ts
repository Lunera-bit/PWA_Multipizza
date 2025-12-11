import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ionic mínimos
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonLabel,
} from '@ionic/angular/standalone';

import { IonMenuComponent } from '../../components/ion-menu/ion-menu.component';

import { ProductService, Product } from '../../services/product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-productos',
  templateUrl: './admin-productos.page.html',
  styleUrls: ['./admin-productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonMenuComponent,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonInput,
    IonButton,
    IonLabel,
  ]
})
export class AdminProductosPage implements OnInit {

  productos$!: Observable<Product[]>;
  editProduct: Product | null = null;
 selectedCategory: string = 'todas';

  constructor(private productService: ProductService) {}

  ngOnInit() {
  this.loadProducts();
}

loadProducts() {
  if (this.selectedCategory === 'todas') {
    this.productos$ = this.productService.getProducts();
  } else {
    this.productos$ = this.productService.getProductsFiltered(this.selectedCategory);
  }
}

changeCategory(cat: string) {
  this.selectedCategory = cat;
  this.editProduct = null; // cerrar editor si estaba abierto
  this.loadProducts();
}


  enableEdit(product: Product) {
    this.editProduct = { ...product }; // clonar
  }

  cancelEdit() {
    this.editProduct = null;
  }

  async deleteProduct(id: string) {
    if (!confirm("¿Eliminar producto?")) return;
    await this.productService.deleteProduct(id);
    alert("Producto eliminado");
  }


saveChanges() {
  if (!this.editProduct || !this.editProduct.id) return;

  const id = this.editProduct.id;

  const updatedData = {
    nombre: this.editProduct.nombre,
    descripcion: this.editProduct.descripcion,
    precio: this.editProduct.precio,
    categoria: this.editProduct.categoria,
    imagen: this.editProduct.imagen
  };

  this.productService.updateProducto(id, updatedData).then(() => {
    console.log("Producto actualizado");
    this.editProduct = null; // Cierra el panel de edición
  });
}


}
