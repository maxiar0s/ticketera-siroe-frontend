import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { Sucursal } from '../../../../interfaces/sucursal.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';
import { SignalService } from '../../../../services/signal.service';
import { LoaderService } from '../../../../services/loader.service';
import { NavegationComponent } from '../../../../shared/navegation/navegation.component';

@Component({
  selector: 'cliente-sucursales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe, NavegationComponent],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent {
  public pagina:        number = 1;
  public paginaActual: number = 1;
  public paginas:      number = 1;
  // Elementos para el paginador (Seccion todas)
  public paginasTodas:      number = 1;
  public totalTodas:        number = 10;
  // Elementos para el paginador (Seccion Pendientes)
  public paginasPendientes: number = 1;
  public totalPendientes:   number = 10;
  // Elementos para el paginador (Seccion Terminados)
  public paginasTerminados: number = 1;
  public totalTerminados:   number = 10;

  // Filtro de sucursales
  private _option!:    string;

  // Arreglo de sucursales
  public sucursales:            Sucursal[] = [];
  public sucursalesTodas!:       Sucursal[];
  public sucursalesPendientes!:  Sucursal[];
  public sucursalesTerminados!:  Sucursal[];
  public obtainedSucursales:    boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private signalService:SignalService,
    private loaderService: LoaderService
  ) {  }

  ngOnInit() {
    this.loaderService.showSection()
    this.signalService.updateData('');
    this.route.queryParams.subscribe(params => {
      this.pagina = params['pagina'] ? +params['pagina'] : 1;
      this.route.params.subscribe(params => {
        const id = params['id']
        this.apiService.sucursales(id, this.pagina, this._option).subscribe({
          next: (respuesta) => {
            // Loader
            this.loaderService.hideSection();

            const { sucursales, paginaActual, paginas, total } = respuesta;
            // Elementos de la respuesta
            this.sucursalesTodas = sucursales;
            this.sucursales = sucursales;
            this.obtainedSucursales = true;
            // Paginador
            this.paginaActual = paginaActual;
            this.paginas = paginas;

            // Todas las sucursales
            this.paginasTodas = paginas;
            this.totalTodas = total;

            // Titulo de la pagina
            this.apiService.client(id).subscribe({
              next: (respuesta) => {
                const { razonSocial } = respuesta;
                this.signalService.updateData(razonSocial);
              },
              error: (error) => {
                console.error('Error al obtener sucursales', error);
              }
            })
          },
          error: (error) => {
            console.error('Error al obtener sucursales', error);
          }
        })
      })
    })
  }

  @Input()
  set selectedOption(value: string) {
    this._option = value;
    this.paginaActual = 1;
    this.cambiarSucursal();
  }

  cambiarSucursal() {
    this.sucursales = [];
    this.loaderService.showSection();
    this.obtainedSucursales = false;
    if(this._option == "Todos los ingresos" && this.sucursalesTodas) {
      this.route.params.subscribe(params => {
        const id = params['id']
        this.apiService.sucursales(id, this.paginaActual, this._option).subscribe({
          next: (respuesta) => {
            this.loaderService.hideSection();
            this.obtainedSucursales = true;
            const { sucursales } = respuesta;
            this.sucursales = sucursales;
        }})
      })
      return;
    }
    else if(this._option == "Pendientes" && this.sucursalesPendientes) {
      this.route.params.subscribe(params => {
        const id = params['id']
        this.apiService.sucursales(id, this.paginaActual, this._option).subscribe({
          next: (respuesta) => {
            this.loaderService.hideSection();
            this.obtainedSucursales = true;
            const { sucursales } = respuesta;
            this.sucursales = sucursales;
        }})
      })
      return;
    }
    else {
      if(this.sucursalesTerminados) {
        this.route.params.subscribe(params => {
          const id = params['id']
          this.apiService.sucursales(id, this.paginaActual, this._option).subscribe({
            next: (respuesta) => {
              this.loaderService.hideSection();
              this.obtainedSucursales = true;
              const { sucursales } = respuesta;
              this.sucursales = sucursales;
          }})
        })
        return;
      } else {
        this.route.params.subscribe(params => {
          const id = params['id']
          this.apiService.sucursales(id, this.pagina, this._option).subscribe({
            next: (respuesta) => {
              this.loaderService.hideSection();
              const { sucursales, paginas, total } = respuesta;

              // Paginador
              this.paginaActual = 1;

              if(this._option == 'Todos los ingresos') {
                this.loaderService.hideSection();
                this.sucursalesTodas = sucursales;
                this.sucursales = this.sucursalesTodas;
              } else if (this._option == 'Pendientes') {
                this.loaderService.hideSection();
                this.sucursalesPendientes = sucursales;
                this.sucursales = this.sucursalesPendientes;
                this.paginasPendientes = paginas;
                this.totalPendientes = total;
              } else {
                this.loaderService.hideSection();
                this.sucursalesTerminados = sucursales;
                this.sucursales = this.sucursalesTerminados;
                this.paginasTerminados = paginas;
                this.totalTerminados = total;
              }
              this.obtainedSucursales = true;
            },
            error: (error) => {
              console.error('Error al obtener sucursales', error);
            }
          })
        })
      }
    }
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
