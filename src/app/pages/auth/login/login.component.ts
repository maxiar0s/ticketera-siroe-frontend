import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public errorMessage: boolean = false;

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

    this.apiService.login(this.loginForm.value).subscribe({
      next: (respuesta) => {
        if(respuesta.token) {
          localStorage.setItem('token', respuesta.token);
          this.authService.userSigned.set(true);
          this.router.navigate(['/dashboard']);
        } else return;
      },
      error: (error) => {
        this.errorMessage = true;
      }
    })
  }
}
