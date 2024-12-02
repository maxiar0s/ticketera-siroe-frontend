import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CrearClienteComponent } from '../../shared/modal/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, CrearClienteComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent {
  constructor(
    private apiService: ApiService
  ) {}

  isModalVisible: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  abrirModal() {
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  crearCliente(datos: any) {
    this.apiService.createClient(datos).subscribe({
      next: (respuesta) => {
        console.log('Cliente creado exitosamente:', respuesta);
        this.successMessage = 'Cliente creado exitosamente!';
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
        this.errorMessage = 'Error al crear cliente: ' + error;
      }
    })
  }
}
