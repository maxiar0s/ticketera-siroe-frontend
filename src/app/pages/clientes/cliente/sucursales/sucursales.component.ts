import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
  // Elementos para el paginador
  public paginaActual:      number = 1;
  public paginas:           number = 1;

  // Filtro de sucursales
  private _option!:    string;

  // Arreglo de sucursales
  public sucursales:            Sucursal[] = [];
  public obtainedSucursales:    boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private signalService:SignalService,
    private loaderService: LoaderService
  ) {  }

  ngOnInit() {
    this.signalService.updateData('');
    this.route.queryParams.subscribe(params => {
      this.paginaActual = params['pagina'] ? +params['pagina'] : 1;
      this.route.params.subscribe(params => {
        const id = params['id']
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
        this.cambiarSucursal();
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

    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.sucursales(id, this.paginaActual, this._option).subscribe({
        next: (respuesta) => {
          this.loaderService.hideSection();
          const { sucursales, paginas } = respuesta;
          if(this._option == 'Todos los ingresos') {
            this.paginas = paginas;
            this.sucursales = sucursales;
          } else if (this._option == 'Pendientes') {
            this.paginas = paginas;
            this.sucursales = sucursales;
          } else {
            this.paginas = paginas;
            this.sucursales = sucursales;
          }
          this.loaderService.hideSection();
          this.obtainedSucursales = true;
        },
        error: (error) => {
          console.error('Error al obtener sucursales', error);
        }
      })
    })
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
