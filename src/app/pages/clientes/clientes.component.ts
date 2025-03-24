import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CrearClienteComponent } from '../../shared/modal/cliente/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente.interface';
import { SignalService } from '../../services/signal.service';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from "../../shared/navegation/navegation.component";
import { SignedUrlPipe } from '../../pipes/generar-url.pipe';
import { AuthService } from '../../services/auth.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';
import { RutPipe } from '../../pipes/rut.pipe';
import { OpcionesClienteComponent } from '../../shared/modal/cliente/opciones-cliente/opciones-cliente.component';

@Component({
  selector: 'clientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CrearClienteComponent,
    NavegationComponent,
    SignedUrlPipe,
    TelefonoPipe,
    RutPipe,
    OpcionesClienteComponent
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  public esAdministrador: boolean = false;

  // Elementos para el paginador
  public paginaActual:    number = 1;
  public paginas:         number = 1;

  public casasMatricez:   Cliente[] | undefined = undefined;
  public obtainedClients: boolean = false;

  // Modal crear cliente
  public isModalVisible:  boolean = false;
  public successMessage:  string = '';
  public errorMessage:    string = '';
  public clienteParaEditar: Cliente | null = null;
  public modoEdicion: boolean = false;

  // Modal opciones cliente
  public isModalAjustesClienteVisible: boolean = false;
  public selectedClienteIndex: number = -1;
  public selectedCliente: Cliente | null = null;

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
    this.modoEdicion = false;
    this.clienteParaEditar = null;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.clienteParaEditar = null;
    this.modoEdicion = false;
  }

  // Métodos para el modal de opciones de cliente
  abrirModalAjustesCliente(index: number) {
    if (this.casasMatricez && this.casasMatricez.length > index) {
      this.selectedClienteIndex = index;
      this.selectedCliente = this.casasMatricez[index];
      this.isModalAjustesClienteVisible = true;
    }
  }

  cerrarModalAjustesCliente() {
    this.isModalAjustesClienteVisible = false;
    this.selectedClienteIndex = -1;
    this.selectedCliente = null;
  }
  //todo: Eliminar cliente
  eliminarCliente(id: string) {
    this.apiService.eliminarCliente(id).subscribe({
      next: (respuesta) => {
        console.log('Cliente eliminado exitosamente:', respuesta);
        this.cargarClientes(); // Recargar la lista de clientes
        this.cerrarModalAjustesCliente();
      },
      error: (error) => {
        console.error('Error al eliminar cliente:', error);
        // Podríamos mostrar un mensaje de error al usuario aquí
        // pero como estamos en un modal que se cierra, sería mejor usar un servicio de notificaciones
        // o un componente de toast para mostrar el error
        this.cerrarModalAjustesCliente();
      }
    });
  }

  //todo: Modificar cliente
  modificarCliente(cliente: Cliente) {
    // Abrir el modal en modo edición con los datos del cliente
    this.clienteParaEditar = cliente;
    this.modoEdicion = true;
    this.isModalVisible = true;
    this.cerrarModalAjustesCliente();
  }

  guardarCliente(datos: any) {
    if (this.modoEdicion && this.clienteParaEditar) {
      // Estamos en modo edición, llamar a modificarCliente
      this.apiService.modificarCliente(this.clienteParaEditar.id, datos).subscribe({
        next: (respuesta) => {
          console.log('Cliente modificado exitosamente:', respuesta);
          this.successMessage = 'Cliente modificado exitosamente!';
          this.cargarClientes();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al modificar cliente:', error);
          this.errorMessage = 'Error al modificar cliente. Por favor, inténtalo de nuevo.';
          // No cerramos el modal para que el usuario pueda ver el mensaje de error
          // y volver a intentarlo si lo desea
        }
      });
    } else {
      // Estamos en modo creación, llamar a createClient
      this.apiService.createClient(datos).subscribe({
        next: (respuesta) => {
          console.log('Cliente creado exitosamente:', respuesta);
          this.successMessage = 'Cliente creado exitosamente!';
          this.cargarClientes();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear cliente:', error);
          this.errorMessage = 'Error al crear cliente. Por favor, inténtalo de nuevo.';
          // No cerramos el modal para que el usuario pueda ver el mensaje de error
        }
      });
    }
  }

  crearCliente(datos: any) {
    this.guardarCliente(datos);
  }

  cargarClientes():void {
    this.casasMatricez = undefined;
    this.obtainedClients = false;
    this.loaderService.showSection();
    this.apiService.clients(this.paginaActual)
      .subscribe({
        next: (respuesta) => {
          if (respuesta) {
            const { paginas, clientes } = respuesta;
            this.loaderService.hideSection();
            this.obtainedClients = true;
            this.casasMatricez = clientes;
            this.paginas = paginas;
          } else {
            this.loaderService.hideSection();
            this.obtainedClients = true;
            this.casasMatricez = [];
            console.error('La respuesta del servidor es null o undefined');
          }
        },
        error: (error) => {
          this.loaderService.hideSection();
          this.obtainedClients = true;
          this.casasMatricez = [];
          console.error('Error al cargar clientes:', error);
        }
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
