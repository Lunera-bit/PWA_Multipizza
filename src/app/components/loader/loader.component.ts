import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnInit, OnDestroy {
  show = false;
  message = '';
  private sub?: Subscription;

  constructor(private loader: LoaderService) {}

  ngOnInit() {
    this.sub = this.loader.state$.subscribe(s => {
      this.show = !!s.show;
      this.message = s.message ?? '';
      console.debug('[LoaderComponent] state', s);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}