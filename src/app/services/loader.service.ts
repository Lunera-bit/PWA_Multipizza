import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private state = new BehaviorSubject<{ show: boolean; message?: string }>({ show: false, message: '' });
  state$ = this.state.asObservable();

  private counter = 0;

  show(message = 'Cargando...') {
    this.counter++;
    this.state.next({ show: true, message });
    console.debug('[LoaderService] show ->', this.counter, message);
  }

  hide(force = false) {
    if (force) this.counter = 0;
    else this.counter = Math.max(0, this.counter - 1);

    console.debug('[LoaderService] hide ->', this.counter);
    if (this.counter === 0) this.state.next({ show: false, message: '' });
  }

  reset() {
    this.counter = 0;
    this.state.next({ show: false, message: '' });
  }
}