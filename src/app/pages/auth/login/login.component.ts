import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoaderService } from '../../../services/loader.service';

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
    this.logging = true;
    this.apiService.login(this.loginForm.value).subscribe({
      next: (respuesta) => {
        if(respuesta.token) {
          this.authService.guardarToken(respuesta.token);
          const destino = this.authService.esCliente() ? '/clientes' : '/dashboard';
          this.router.navigate([destino]);
        } else {
          this.errorMessage = true;
        }
        this.logging = false;
      }
    })
  }
}
