import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/modificar-equipo/modificar-equipo.component';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { FormatoFechaPipe } from '../../../pipes/formato-fecha.pipe';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule, ModificarEquipoComponent, LoaderComponent, FormatoFechaPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  public _option!: string;
  // Oculta la informacion hasta que se carga
  public obtainedEquipments: boolean = false;
  @Output() hideNavegation = new EventEmitter<boolean>;

  // Arreglo de equipos
  public equipos: Equipo[] = [];
  public equiposTodos!: Equipo[];
  public equiposPendientes!: Equipo[];
  public equiposTerminados!: Equipo[];

  @Input() id: string = '';
  public selectedEquipoId!: number;

  // Modal
  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {  }

  ngOnInit() {
    this.loaderService.showSection();
    this.apiService.equipmentsBySucursal(this.id).subscribe({
      next: (respuesta) => {
        this.equipos = respuesta;
        this.equiposTodos = respuesta;
        this.loaderService.hideSection();
        this.obtainedEquipments = true;
        this.hideNavegation.emit(true);
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
      }
    })
  }

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
  set selectedOption(value: string) {
    this._option = value;
    this.changeSelected();
  }

  changeSelected() {
    if(this._option === "Todos los ingresos") {
      if (!Array.isArray(this.equiposTodos)) {
        this.equipos = [this.equiposTodos];
      } else {
        this.equipos = this.equiposTodos;
      }
    }

    else if(this._option === "Pendientes") {
      if(this.equiposPendientes) {
        if (!Array.isArray(this.equiposPendientes)) {
          this.equipos = [this.equiposPendientes];
        } else {
          this.equipos = this.equiposPendientes;
        }
      } else {
        this.apiService.equipmentsBySucursal(this.id).subscribe({
          next: (respuesta) => {
            this.loaderService.hideSection();
            this.equipos = respuesta;
            this.equiposPendientes = respuesta[1];
            this.obtainedEquipments = true;
          },
          error: (error) => {
            console.error('Error al obtener sucursales', error);
          }
        })
      }

    } else {
      if(this.equiposTerminados) {
        if (!Array.isArray(this.equiposTerminados)) {
          this.equipos = [this.equiposTerminados];
        } else {
          this.equipos = this.equiposTerminados;
        }
      } else {
        this.apiService.equipmentsBySucursal(this.id).subscribe({
          next: (respuesta) => {
            this.loaderService.hideSection();
            this.equipos = respuesta;
            this.equiposTerminados = respuesta;
            this.obtainedEquipments = true;
          },
          error: (error) => {
            console.error('Error al obtener sucursales', error);
          }
        })
      }
    }
  }
}
