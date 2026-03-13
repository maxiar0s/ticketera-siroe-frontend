import { Cuenta } from './../../../interfaces/Cuenta.interface';
import { Component, Input } from '@angular/core';
import { SignalService } from '../../../services/signal.service';
import { HeaderComponent } from './header/header.component';
import { TableUsersComponent } from './table-users/table-users.component';
import { OptionsComponent } from './options/options.component';
import { ApiService } from '../../../services/api.service';
import { LoaderService } from '../../../services/loader.service';
import { NavegationComponent } from '../../../shared/navegation/navegation.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    HeaderComponent,
    OptionsComponent,
    TableUsersComponent,
    NavegationComponent,
    CommonModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent {
  @Input() embebidoEnConfiguracion = false;

  // Search term for filtering users
  public searchTerm: string = '';

  // Arreglo cuentas
  public idAdministrador: number | undefined = undefined;
  public indiceCuenta!: number;
  public cuentas: Cuenta[] | undefined = undefined;

  // Elementos para el paginador
  public paginaActual: number = 1;
  public paginas: number = 1;

  public obtainedUsers: boolean = false;

  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    public loaderService: LoaderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.embebidoEnConfiguracion) {
      this.signalService.updateData('Gestión de usuarios');
    }

    const decodificado = this.authService.decodificarToken();
    if (decodificado) {
      const { id } = decodificado;
      this.idAdministrador = id;
    }

    this.cargarCuentas();
  }

  abrirModal() {
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cargarCuentas(): void {
    this.cuentas = undefined;
    this.obtainedUsers = false;
    this.loaderService.showSection();
    this.apiService
      .users(this.paginaActual, undefined, this.searchTerm)
      .subscribe((respuesta) => {
        const { cuentas, paginas } = respuesta;
        this.loaderService.hideSection();
        this.obtainedUsers = true;
        this.cuentas = cuentas;
        this.paginas = paginas;
      });
  }

  modificarIndice(indice: number) {
    this.indiceCuenta = indice;
  }

  eliminarCuenta(id: any) {
    this.apiService.deleteUser(id).subscribe({
      next: (respuesta) => {
        if (respuesta.error) {
          console.error('Error al eliminar usuario');
        } else {
          console.log('Usuario eliminado exitosamente');
          this.cargarCuentas();
        }
      },
    });
  }

  Cuenta(datos: any) {
    this.apiService.createModifyUser(datos).subscribe({
      next: (respuesta) => {
        if (respuesta.error) {
          console.error('Error al crear usuario:', respuesta.error);
        } else {
          if (datos.id) {
            if (this.cuentas) {
              this.cuentas![this.indiceCuenta] = respuesta;
              console.log('Usuario modificado exitosamente:', respuesta);
            }
          } else {
            console.log('Usuario creado exitosamente:', respuesta);
            this.cargarCuentas();
          }
        }
      },
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cargarCuentas();
    }
  }

  nextPage(): void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cargarCuentas();
    }
  }

  prevPage(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarCuentas();
    }
  }

  selectedOption(value: string) {
    this.searchTerm = value;
    this.paginaActual = 1;
    this.cargarCuentas();
  }
}
