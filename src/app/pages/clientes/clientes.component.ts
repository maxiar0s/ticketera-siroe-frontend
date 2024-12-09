import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CrearClienteComponent } from '../../shared/modal/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente.interface';
import { SignalService } from '../../services/signal.service';
import { NgxSpinnerModule } from "ngx-spinner";


@Component({
  selector: 'clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, CrearClienteComponent,     NgxSpinnerModule ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent {
  public clients:Cliente[] = [];
  public obtainedClients: boolean = false;

  constructor(
    private apiService: ApiService,
    private signalService: SignalService
  ) {}

  ngOnInit(): void {

    this.signalService.updateData('Clientes');


    this.apiService.clients().subscribe({
      next: (respuesta) => {
        this.obtainedClients = true;
        this.clients = respuesta;
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
      }
    })
  }

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
