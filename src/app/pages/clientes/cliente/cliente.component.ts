import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { LoaderService } from '../../../services/loader.service';
import { CasaMatrizComponent } from "./casa-matriz/casa-matriz.component";
import { OptionsComponent } from '../../../shared/options/options.component';
import { Sucursal } from '../../../interfaces/Sucursal.interface';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalService } from '../../../services/signal.service';
import { Cliente } from '../../../interfaces/cliente.interface';
import { NavegationComponent } from "../../../shared/navegation/navegation.component";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { normalizarServicios } from '../../../utils/servicios.util';

@Component({
  selector: 'cliente',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, SucursalesComponent, CasaMatrizComponent, NavegationComponent, CommonModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent {
  public cerrarModal!: boolean;
  public esAdministrador: boolean = false;
  // Elementos para el paginador
  public paginaActual:          number = 1;
  public paginas:               number = 1;
  // Filtro de sucursales
  private option!:              string;
  // Arreglo de sucursales
  public indiceTabla!:          number;
  public casaMatrizId!:         string;
  public cliente?:              Cliente;
  public sucursales:            Sucursal[] | undefined = undefined;
  public obtainedSucursales:    boolean = false;
  public Title:                 boolean = false;

  constructor(
    private apiService:         ApiService,
    private route:              ActivatedRoute,
    private signalService:      SignalService,
    private router:             Router,
    public loaderService:       LoaderService,
    private authService: AuthService,
  ) {  }

  ngOnInit() {
    this.cambiarSucursal();
    this.esAdministrador = this.authService.esAdministrador();
  }

  selectedOption(value: string) {
    this.option = value;
    this.paginaActual = 1;
    this.sucursales = undefined;
    this.cambiarSucursal();
  }

  crearModificarSucursal(datos: any) {
    this.apiService.createModifyBranch(datos).subscribe({
      next: (respuesta) => {
        if(respuesta.resp == 'mod') {
          if(this.sucursales) {
            this.sucursales[this.indiceTabla] = respuesta.sucursal;
          }
        } else {
          this.cambiarSucursal();
        }
        this.cerrarModal = false;
      },
      error: (error) => {
        console.error('Error al crear o modificar sucursal:', error);
      }
    })
  }

  eliminarSucursal(datos: any) {
    console.log(datos)
    this.apiService.deleteBranch(datos).subscribe({
      next: (respuesta) => {
        if(respuesta) {
          this.cambiarSucursal();
        }
      },
      error: (error) => {
        console.error('Error al crear o modificar sucursal:', error);
      }
    })
  }

  modificarIndiceTable(event: number) {
    this.indiceTabla = event;
  }

  cambiarSucursal() {
    this.sucursales = undefined;
    this.loaderService.showSection();
    this.obtainedSucursales = false;

    if(!this.Title) this.signalService.updateData('');;

    this.route.params.subscribe(params => {
      const id = params['id'];
      this.casaMatrizId = id;
      this.apiService.client(id, this.paginaActual, this.option).subscribe({
        next: (respuesta) => {
          this.loaderService.hideSection();
          const { cliente, paginas } = respuesta;

          if(!cliente) {
            this.router.navigate(['/clientes']);
            return;
          }

          if(!this.Title) this.headerTitle(cliente.razonSocial);

          const {
            id,
            imagen,
            rut,
            razonSocial,
            encargadoGeneral,
            correo,
            telefonoEncargado,
            fechaIngreso,
            visitasMensuales = 0,
            visitasEmergenciaAnuales = 0,
            visitasMensualesRealizadas = 0,
            visitasEmergenciaAnualesRealizadas = 0,
            servicios: serviciosRespuesta = [],
          } = cliente;
          const servicios = normalizarServicios(serviciosRespuesta);
          this.cliente = {
            ...(this.cliente ?? {}),
            id,
            imagen,
            rut,
            razonSocial,
            encargadoGeneral,
            correo,
            telefonoEncargado,
            fechaIngreso,
            visitasMensuales,
            visitasEmergenciaAnuales,
            visitasMensualesRealizadas,
            visitasEmergenciaAnualesRealizadas,
            servicios,
          };
          this.paginas = paginas;
          this.sucursales = cliente.sucursales;
          this.loaderService.hideSection();
          this.obtainedSucursales = true;
        },
        error: (error) => {
          console.error('Error al obtener sucursales', error);
        }
      })
    })
  }

  headerTitle(value: string) {
    this.signalService.updateData(value);
    this.Title = true;
  }

  cambiarPagina(pagina: number):void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cambiarSucursal();
    }
  }

  nextPage():void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cambiarSucursal();
    }
  }

  prevPage():void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cambiarSucursal();
    }
  }
}
