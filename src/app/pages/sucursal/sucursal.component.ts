import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonsComponent } from './options/options.component';
import { OptionsComponent } from '../../shared/options/options.component';
import { ImprimirEquipo } from '../../interfaces/imprimir-equipo.interface';
import { Equipo } from '../../interfaces/equipo.interface';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from '../../shared/navegation/navegation.component';

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [HeaderComponent, TableComponent, CommonModule, ButtonsComponent, OptionsComponent, NavegationComponent],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {
  // Elementos para el paginador
  public paginaActual:        number = 1;
  public paginas:             number = 1;
  // Filtro de equipos
  public option!:             string;
  // Arreglo de los equipos
  public sucursal?:           Sucursal;
  public equipos:             Equipo[] = [];
  public obtainedEquipments:  boolean = false;
  public estado:              boolean = false;
  public Title:                 boolean = false;

  public Devices:       ImprimirEquipo[] = [];

  constructor(
    private apiService:     ApiService,
    private signalService:  SignalService,
    public loaderService :  LoaderService,
    private route:          ActivatedRoute,
  ) {}

  ngOnInit() {
    this.cambiarSeleccion();
  }

  selectedOption(value: string) {
    this.option = value;
    this.cambiarSeleccion();
  }

  cambiarSeleccion() {
    this.equipos = [];
    this.loaderService.showSection();
    this.obtainedEquipments = false;

    if(!this.Title) this.signalService.updateData('');;

    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.sucursal(id, this.paginaActual, this.option).subscribe({
        next: (respuesta) => {
          const { sucursal, paginas } = respuesta;

          if(!this.Title) this.headerTitle(sucursal.casaMatriz.razonSocial);
          console.log(paginas)
          this.sucursal = sucursal;
          this.equipos = sucursal.equipos;
          this.paginas = paginas;

          this.obtainedEquipments = true;
          if(sucursal.estado != 3) this.estado = true;

          this.loaderService.hideSection();
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
      this.cambiarSeleccion();
    }
  }

  nextPage():void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cambiarSeleccion();
    }
  }

  prevPage():void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cambiarSeleccion();
    }
  }

  selectedDevices(Devices: any) {
    this.Devices = Devices;
  }
}
