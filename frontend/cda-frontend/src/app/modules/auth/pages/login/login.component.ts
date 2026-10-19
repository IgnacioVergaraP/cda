import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  form: FormGroup;
  enviando = false;
  errorMensaje: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  get emailCtrl() { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.enviando) return;

    this.errorMensaje = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const { email, password } = this.form.value;

    this.auth
      .login(email, password)
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: () => {
          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          const rol = this.auth.usuarioActual?.rol;
          const defaultRoute = rol === 'profesor'
            ? '/profesor'
            : rol === 'gimnasio'
              ? '/admin'
              : '/rutinas';
          this.router.navigateByUrl(redirect || defaultRoute);
        },
        error: (err: any) => {
          // Supabase devuelve un mensaje en err.message
          this.errorMensaje = this.parseError(err);
        },
      });
  }

  private parseError(err: any): string {
    const msg = err?.message ?? '';
    if (msg.toLowerCase().includes('invalid login credentials')) {
      return 'Email o contraseña incorrectos.';
    }
    if (msg.toLowerCase().includes('email not confirmed')) {
      return 'Confirmá tu email antes de ingresar.';
    }
    return msg || 'No se pudo iniciar sesión.';
  }
}