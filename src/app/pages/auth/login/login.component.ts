import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    private apiService: ApiService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  postLogin() {
    if(this.loginForm.invalid) return;

    this.apiService.login(this.loginForm.value).subscribe({
      next: (respuesta) => {
        console.log(respuesta);
        localStorage.setItem('token', respuesta.token);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = true;
      }
    })
  }
}
