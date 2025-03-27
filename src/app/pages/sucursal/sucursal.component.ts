import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/Sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonsComponent } from './options/options.component';
import { OptionsComponent } from '../../shared/options/options.component';
import { ImprimirEquipo } from '../../interfaces/ImprimirEquipo.interface';
import { Equipo } from '../../interfaces/equipo.interface';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { concatMap, forkJoin, from } from 'rxjs';

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
  public equipos:             Equipo[] | undefined = undefined;
  public obtainedEquipments:  boolean = false;
  public estado:              boolean = false;
  public Title:               boolean = false;
  public cerrarModal!:        boolean;

  public Devices:       ImprimirEquipo[] = [];

  constructor(
    private apiService:     ApiService,
    private signalService:  SignalService,
    public loaderService :  LoaderService,
    private route:          ActivatedRoute,
    private router:         Router
  ) {}

  ngOnInit() {
    this.cambiarSeleccion();
  }

    // Método para obtener el ID de la sucursal actual de la ruta
    getSucursalId(): string {
      let id = '';
      this.route.params.subscribe(params => {
        id = params['id'];
      });
      return id;
    }

  crearEquipos(datos: any) {
    this.cerrarModal = true;
    const { cantidad } = datos;

    const solicitudes = Array.from({ length: cantidad }, () =>
      this.apiService.createEquiptment(datos)
    );

    forkJoin(solicitudes).subscribe({
      next: (respuestas) => {
        respuestas.forEach((respuesta, index) => {
          if (respuesta.error) {
            console.error(`Error en el equipo ${index + 1}:`, respuesta.error);
          } else {
            console.log(`Equipo ${index + 1} creado exitosamente:`, respuesta);
          }
        });
      },
      error: (error) => {
        console.error('Error general al crear equipos:', error);
      },
      complete: () => {
        console.log('Proceso de creación de equipos completado.');
        this.cerrarModal = false;
        this.cambiarSeleccion();
      }
    });
  }

  selectedOption(value: string) {
    this.option = value;
    this.equipos = undefined;
    this.paginaActual = 1;
    this.paginas = 1;
    this.cambiarSeleccion();
  }

  cambiarSeleccion() {
    this.equipos = undefined;
    this.loaderService.showSection();
    this.obtainedEquipments = false;

    if(!this.Title) this.signalService.updateData('');;

    this.route.params.subscribe(params => {
      const id = params['id']
      const idCliente = params['idCliente']
      this.apiService.sucursal(id, this.paginaActual, this.option).subscribe({
        next: (respuesta) => {
          const { sucursal, paginas } = respuesta;

          if (!sucursal) {
            this.router.navigate([`/clientes/${idCliente}`]);
            return;
          }

          if(!this.Title) this.headerTitle(sucursal.casaMatriz.razonSocial);

          this.sucursal = sucursal;

          // Ordenar los equipos por los últimos 3 dígitos del codigoId en orden ascendente
          if (sucursal.equipos && sucursal.equipos.length > 0) {
            this.equipos = [...sucursal.equipos].sort((a, b) => {
              const numA = parseInt(a.codigoId.slice(-3));
              const numB = parseInt(b.codigoId.slice(-3));
              return numA - numB;
            });
          } else {
            this.equipos = sucursal.equipos;
          }

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
