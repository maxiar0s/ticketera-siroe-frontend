import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoaderService } from '../../../services/loader.service';
import { BRAND } from '../../../config/branding';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public errorMessage: boolean = false;
  public logging!: boolean;
  public brand = BRAND;
  public loginLogo = BRAND.loginLogo ?? BRAND.logoMain;

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required],],
    password: ['', [Validators.required],]
  })

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  postLogin() {
    if(this.loginForm.invalid) return;
    this.errorMessage = false;
    this.logging = true;
    this.apiService.login(this.loginForm.value).subscribe({
      next: (respuesta) => {
        const token = respuesta?.token;
        if(token) {
          this.authService.guardarToken(token);
          const destino = this.authService.esCliente() ? '/dashboard-cliente' : '/dashboard';
          this.router.navigate([destino]);
        } else {
          this.errorMessage = true;
        }
        this.logging = false;
      },
      error: () => {
        this.errorMessage = true;
        this.logging = false;
      }
    })
  }
}
