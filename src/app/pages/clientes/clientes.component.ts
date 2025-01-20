import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CrearClienteComponent } from '../../shared/modal/cliente/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/Cliente.interface';
import { SignalService } from '../../services/signal.service';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from "../../shared/navegation/navegation.component";
import { SignedUrlPipe } from '../../pipes/generar-url.pipe';
import { AuthService } from '../../services/auth.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';
import { RutPipe } from '../../pipes/rut.pipe';

@Component({
  selector: 'clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, CrearClienteComponent, NavegationComponent, NavegationComponent, SignedUrlPipe, TelefonoPipe, RutPipe],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent {
  public esAdministrador: boolean = false;

  // Elementos para el paginador
  public paginaActual:    number = 1;
  public paginas:         number = 1;

  public casasMatricez:   Cliente[] | undefined = undefined;
  public obtainedClients: boolean = false;

  public isModalVisible:  boolean = false;
  public successMessage:  string = '';
  public errorMessage:    string = '';

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    public loaderService: LoaderService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.signalService.updateData('Clientes');
    this.esAdministrador = this.authService.esAdministrador();
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
        this.cargarClientes();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
        this.errorMessage = 'Error al crear cliente: ' + error;
      }
    })
  }

  cargarClientes():void {
    this.casasMatricez = undefined;
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
