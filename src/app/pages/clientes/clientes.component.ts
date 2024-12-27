import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  // Elementos para el paginador
  public paginaActual:  number = 1;
  public paginas:       number = 1;

  public casasMatricez:Cliente[] = [];
  public obtainedClients: boolean = false;

  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    public loaderService: LoaderService,
  ) {}

  ngOnInit(): void {
    this.signalService.updateData('Clientes');
    this.cargarClientes();
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

  cargarClientes():void {
    this.obtainedClients = false;
    this.loaderService.showSection();
    this.apiService.clients(this.paginaActual)
      .subscribe(respuesta => {
        const { paginas, clientes } = respuesta
        this.loaderService.hideSection();
        this.obtainedClients = true;

        this.casasMatricez = clientes;
        this.paginas = paginas;
      });
  }

  cambiarPagina(pagina: number):void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cargarClientes();
    }
  }

  nextPage():void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cargarClientes();
    }
  }

  prevPage():void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarClientes();
    }
  }
}
