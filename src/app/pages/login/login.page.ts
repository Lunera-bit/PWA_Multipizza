import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  showEmailForm = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  toggleEmailForm() {
    this.showEmailForm = !this.showEmailForm;
  }

  async showToast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000 });
    await t.present();
  }

  private async showLoading(msg = 'Espere...') {
    const l = await this.loadingCtrl.create({ message: msg });
    await l.present();
    return l;
  }

  async loginEmail() {
    if (this.form.invalid) return this.showToast('Correo o contraseña inválidos');
    const l = await this.showLoading('Iniciando sesión...');
    try {
      await this.auth.signInEmail(this.form.value.email!, this.form.value.password!);
      await l.dismiss();
      await this.showToast('Sesión iniciada');
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inicio';
      await this.router.navigateByUrl(returnUrl);
    } catch (err: any) {
      await l.dismiss();
      this.showToast(err?.message || 'Error iniciando sesión');
    }
  }

  async registerEmail() {
    if (this.form.invalid) return this.showToast('Completa correo y contraseña (mín 6)');
    const l = await this.showLoading('Creando cuenta...');
    try {
      await this.auth.signUpEmail(this.form.value.email!, this.form.value.password!);
      await l.dismiss();
      await this.showToast('Cuenta creada');
      this.router.navigateByUrl('/');
    } catch (err: any) {
      await l.dismiss();
      this.showToast(err?.message || 'Error creando cuenta');
    }
  }

  async loginGoogle() {
    const l = await this.showLoading('Iniciando con Google...');
    try {
      await this.auth.signInWithGoogle();
      await l.dismiss();
      await this.showToast('Sesión con Google iniciada');
      this.router.navigateByUrl('/inicio');
    } catch (err: any) {
      await l.dismiss();
      this.showToast(err?.message || 'Error con Google Sign-In');
    }
  }

  async loginApple() {
    const l = await this.showLoading('Iniciando con Apple...');
    try {
      await this.auth.signInWithApple();
      await l.dismiss();
      await this.showToast('Sesión con Apple iniciada');
      this.router.navigateByUrl('/inicio');
    } catch (err: any) {
      await l.dismiss();
      this.showToast(err?.message || 'Error con Apple Sign-In');
    }
  }

  async resetPassword() {
    const email = this.form.value.email;
    if (!email || this.form.get('email')?.invalid) {
      return this.showToast('Ingresa tu correo para recuperar contraseña');
    }
    const l = await this.showLoading('Enviando correo...');
    try {
      await this.auth.sendPasswordReset(email);
      await l.dismiss();
      await this.showToast('Se envió un correo con instrucciones');
    } catch (err: any) {
      await l.dismiss();
      this.showToast(err?.message || 'Error enviando correo');
    }
  }

  skip() {
    // navegar a /inicio indicando skip para que el guard permita acceso
    this.router.navigate(['/inicio'], { queryParams: { skip: '1' } });
  }
}