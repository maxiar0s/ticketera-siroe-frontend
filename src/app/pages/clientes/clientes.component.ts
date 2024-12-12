import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CrearClienteComponent } from '../../shared/modal/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente.interface';
import { SignalService } from '../../services/signal.service';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from "../../shared/navegation/navegation.component";

@Component({
  selector: 'clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, CrearClienteComponent, LoaderComponent, NavegationComponent, NavegationComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent {
  public clients:Cliente[] = [];
  public obtainedClients: boolean = false;

  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    public loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.showSection();
    this.signalService.updateData('Clientes');

    this.apiService.clients().subscribe({
      next: (respuesta) => {
        this.loaderService.hideSection();
        this.clients = respuesta;
        this.obtainedClients = true;
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
      }
    })
  }

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
