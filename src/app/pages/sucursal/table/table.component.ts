import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/modificar-equipo/modificar-equipo.component';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { FormatoFechaPipe } from '../../../pipes/formato-fecha.pipe';
import { ActivatedRoute } from '@angular/router';
import { NavegationComponent } from '../../../shared/navegation/navegation.component';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule, ModificarEquipoComponent, LoaderComponent, FormatoFechaPipe, NavegationComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  // Elementos para el paginador
  public paginaActual: number = 1;
  public paginas:      number = 1;

  public _option!: string;
  private idSucursal?: string;
  @Input() estado?: boolean;

  // Oculta la informacion hasta que se carga
  public obtainedEquipments: boolean = false;

  // Arreglo de equipos
  public equipos: Equipo[] = [];

  @Input() id: string = '';
  public selectedEquipoId!: number;

  // Modal
  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private loaderService: LoaderService
  ) {  }

  // ngOnInit() {
  //   this.cambiarSeleccion();
  // }

  abrirModal(id: number) {
    this.selectedEquipoId = id;
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  modificarEquipo(datos: any) {
    this.apiService.modifyEquiptment(datos).subscribe({
      next: (respuesta) => {
        console.log('Equipo modificado exitosamente:', respuesta);
        this.successMessage = 'Equipo modificado exitosamente!';
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al modificadar equipo:', error);
        this.errorMessage = 'Error al modificadar equipo: ' + error;
      }
    })
  }

  @Input()
  set idSelected(value: string) {
    this.idSucursal = value;
    this.cambiarSeleccion();
  }

  @Input()
  set selectedOption(value: string) {
    this._option = value;
    this.paginaActual = 1;
    this.cambiarSeleccion();
  }

  cambiarSeleccion() {
    this.equipos = [];
    this.loaderService.showSection();
    this.obtainedEquipments = false;

    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.equipmentsBySucursal(id, this.paginaActual, this._option).subscribe({
        next: (respuesta) => {
          const { equipos, paginas, total } = respuesta;
          if(this._option == 'Todos los ingresos') {
            this.equipos = equipos;
            this.paginas = paginas;
          } else if (this._option == 'Pendientes') {
            this.equipos = equipos;
            this.paginas = paginas;
          } else {
            this.equipos = equipos;
            this.paginas = paginas;
          }
          this.loaderService.hideSection();
          this.obtainedEquipments = true;
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

}
