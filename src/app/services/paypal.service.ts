import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) { }

  createOrder(amount: number, description: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/paypalCreateOrder`, {
      amount,
      description
    }).pipe(
      catchError(this.handleError)
    );
  }

  captureOrder(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/paypalCaptureOrder`, {
      orderId
    }).pipe(
      catchError(this.handleError)
    );
  }

  private getApiUrl(): string {
    const host = window.location.hostname;
    return `http://${host}:5001/multipizza-1/us-central1`;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en PayPal Service:', error);
    return throwError(() => new Error('Error de comunicación con PayPal'));
  }
}