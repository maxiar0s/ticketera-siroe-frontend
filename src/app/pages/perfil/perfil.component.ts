import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Cuenta } from '../../interfaces/Cuenta.interface';

@Component({
  selector: 'perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  usuario: Cuenta | null = null;
  loading = true;

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit(): void {
    const token = this.authService.decodificarToken();
    if (token && token.id) {
      this.apiService.users(1, '').subscribe(res => {
        if (res && res.cuentas) {
          this.usuario = res.cuentas.find((u: Cuenta) => u.id === token.id) || null;
        }
        this.loading = false;
      }, _ => this.loading = false);
    } else {
      this.loading = false;
    }
  }
}
