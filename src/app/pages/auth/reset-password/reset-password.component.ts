import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  public resetError = '';
  public resetSuccess = '';
  public enviando = false;
  public token = '';

  public resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      this.token = `${params.get('token') || ''}`.trim();
    });
  }

  enviarNuevaContrasena(): void {
    this.resetError = '';
    this.resetSuccess = '';

    if (!this.token) {
      this.resetError = 'El enlace de recuperacion es invalido.';
      return;
    }

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const password = `${this.resetForm.value?.password || ''}`;
    const confirmPassword = `${this.resetForm.value?.confirmPassword || ''}`;

    if (password !== confirmPassword) {
      this.resetError = 'Las contrasenas no coinciden.';
      return;
    }

    this.enviando = true;

    this.apiService.restablecerContrasena(this.token, password).subscribe({
      next: (respuesta) => {
        if (respuesta?.resp) {
          this.resetSuccess = respuesta.resp;
          this.resetForm.reset();
        } else {
          this.resetError =
            'No fue posible restablecer la contrasena. Solicita un nuevo enlace.';
        }
        this.enviando = false;
      },
      error: () => {
        this.resetError =
          'No fue posible restablecer la contrasena. Solicita un nuevo enlace.';
        this.enviando = false;
      },
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
