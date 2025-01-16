import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { LoaderService } from '../../../services/loader.service';
import { LoaderComponent } from "../../../shared/loader/loader.component";
import { CasaMatrizComponent } from "./casa-matriz/casa-matriz.component";
import { OptionsComponent } from '../../../shared/options/options.component';
import { Sucursal } from '../../../interfaces/sucursal.interface';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalService } from '../../../services/signal.service';
import { Cliente } from '../../../interfaces/cliente.interface';
import { NavegationComponent } from "../../../shared/navegation/navegation.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cliente',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, SucursalesComponent, LoaderComponent, CasaMatrizComponent, NavegationComponent, CommonModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent {
  // Elementos para el paginador
  public paginaActual:          number = 1;
  public paginas:               number = 1;
  // Filtro de sucursales
  private option!:              string;
  // Arreglo de sucursales
  public cliente?:              Cliente;
  public sucursales:            Sucursal[] = [];
  public obtainedSucursales:    boolean = false;
  public Title:                 boolean = false;

  constructor(
    private apiService:         ApiService,
    private route:              ActivatedRoute,
    private signalService:      SignalService,
    public loaderService:       LoaderService
  ) {  }

  ngOnInit() {
    this.cambiarSucursal();
  }

  selectedOption(value: string) {
    this.option = value;
    this.paginaActual = 1;
    this.cambiarSucursal();
  }

  cambiarSucursal() {
    this.sucursales = [];
    this.loaderService.showSection();
    this.obtainedSucursales = false;

    if(!this.Title) this.signalService.updateData('');;

    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.client(id, this.paginaActual, this.option).subscribe({
        next: (respuesta) => {
          this.loaderService.hideSection();
          const { cliente, paginas } = respuesta;

          if(!this.Title) this.headerTitle(cliente.razonSocial);

          if(!this.cliente) {
            const { id, imagen, rut, razonSocial, encargadoGeneral, correo, telefonoEncargado, fechaIngreso } = cliente;
            this.cliente = { id, imagen, rut, razonSocial, encargadoGeneral, correo, telefonoEncargado, fechaIngreso };
          }
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
