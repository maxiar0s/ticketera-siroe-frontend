import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/equipo/modificar-equipo/modificar-equipo.component';
import { LoaderService } from '../../../services/loader.service';
import { FormatoFechaPipe } from '../../../pipes/formato-fecha.pipe';
import { ImprimirEquipo } from '../../../interfaces/ImprimirEquipo.interface';
import { VerInformacionComponent } from '../../../shared/modal/equipo/ver-informacion/ver-informacion.component';
import { EstadoEquipo } from '../../../interfaces/estado-equipo.interface';

//todo#TODO: Los estados deben ser funcionales

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [
    CommonModule,
    ModificarEquipoComponent,
    FormatoFechaPipe,
    VerInformacionComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent {
  // Arreglo de equipos
  public obtainedEquipments: boolean = false;
  public equipos?: Equipo[] | undefined | null;
  @Input() paginaActual!: number;
  //?
  @Input() sucursalId?: string;

  // Modal de edicion de equipo
  public selectedEquipoId!: number;
  public equipo!: Equipo;

  // Para modal de imprimir etiquetas
  public checkboxesState: boolean[] = [];
  public selectedDevices: ImprimirEquipo[] = [];
  @Output() Devices = new EventEmitter<any>();

  // Modal
  public isModalVisible: boolean = false;
  public isModalVerInfo: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  //? Estados de equipos
  public estadosEquipo: EstadoEquipo[] = [];

  // Evento para notificar cuando se elimina un equipo
  @Output() equipoEliminado = new EventEmitter<void>();

  @Output() equipoActualizado = new EventEmitter<void>();

  constructor(
    private apiService: ApiService,
    public loaderService: LoaderService
  ) {
      // Cargar los estados de equipos al inicializar el componente
      this.cargarEstadosEquipo();

  }

  @Input()
  set equiposRecibidos(value: Equipo[] | undefined | null) {
    // No ordenamos los equipos aquí porque la paginación se maneja en el backend
    this.equipos = value;

    if (this.equipos === undefined || this.equipos === null) {
      this.checkboxesState = new Array().fill(false);
    } else {
      this.checkboxesState = new Array(this.equipos.length).fill(false);
    }

    this.obtainedEquipments = true;
  }

   // ? Método para cargar los estados de equipos
  cargarEstadosEquipo() {
    this.apiService.getEstadosEquipo().subscribe({
      next: (estados) => {
        this.estadosEquipo = estados;
      },
      error: (error) => {
        console.error('Error al cargar estados de equipos:', error);
      }
    });
  }

  // ? Método para obtener el nombre del estado según su ID
  getNombreEstado(estadoId: number): string {
    const estado = this.estadosEquipo.find(e => e.id === estadoId);
    return estado ? estado.name : 'Desconocido';
  }

  // ? Método para actualizar el estado de un equipo
  cambiarEstadoEquipo(equipoId: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const nuevoEstado = selectElement.value;

    this.loaderService.showModal();
    this.apiService.actualizarEstadoEquipo(equipoId, nuevoEstado).subscribe({
      next: () => {
        // Actualizar el equipo en la lista local
        if (this.equipos) {
          const equipo = this.equipos.find(e => e.id === equipoId);
          if (equipo) {
            equipo.estado = Number(nuevoEstado);
          }
        }
        this.loaderService.hideModal();
      },
      error: (error) => {
        console.error('Error al actualizar estado del equipo:', error);
        this.loaderService.hideModal();
      }
    });
  }


  abrirModal(id: number) {
    this.selectedEquipoId = id;
    this.isModalVisible = true;
  }

  abrirModalVer(idEquipo: number, indice: number) {
    if (this.equipos) {
      this.selectedEquipoId = idEquipo;
      this.equipo = this.equipos[indice];
      this.isModalVerInfo = true;
    }
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Método para eliminar un equipo directamente
  eliminarEquipo(id: number) {
    this.loaderService.showModal();
    this.apiService.deleteEquipment(id).subscribe({
      next: (respuesta) => {
        console.log('Equipo eliminado exitosamente:', respuesta);
        // Emitir evento para actualizar la lista de equipos
        if (this.equipos) {
          this.equipos = this.equipos.filter((equipo) => equipo.id !== id);
        }
        this.equipoEliminado.emit();
        this.loaderService.hideModal();
      },
      error: (error) => {
        console.error('Error al eliminar equipo:', error);
        this.loaderService.hideModal();
      },
    });
  }

  cerrarModalVerInfo() {
    this.isModalVerInfo = false;
    this.actualizarTabla();
  }


  modificarEquipo(datos: any) {
    this.apiService.modifyEquiptment(datos).subscribe({
      next: (respuesta) => {
        console.log('Equipo modificado exitosamente:', respuesta);
        this.successMessage = 'Equipo modificado exitosamente!';
        this.cerrarModal();
        //?emitir evento
        this.equipoActualizado.emit();
        this.loaderService.hideModal();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al modificadar equipo:', error);
        this.errorMessage = 'Error al modificadar equipo: ' + error;
        this.loaderService.hideModal();
      },
    });
  }

  seleccionarEquipo(equipo: Equipo, codigoId: string, i: number): void {
    this.checkboxesState[i] = !this.checkboxesState[i];
    const index = this.selectedDevices.findIndex(
      (device) => device.codigoId === codigoId
    );

    if (index !== -1) {
      this.selectedDevices.splice(index, 1);
    } else {
      this.selectedDevices.push({
        codigoId: equipo.codigoId,
        fechaIngreso: equipo.fechaIngreso,
        departamento: equipo.departamento,
      });
    }
    this.enviarEquipos();
  }

  actualizarTabla() {
    if (this.sucursalId) {
      this.loaderService.showModal();
      // Obtener los equipos actualizados de la sucursal
      this.apiService.sucursal(this.sucursalId, this.paginaActual, '').subscribe({
        next: (respuesta) => {
          const updatedEquipos = respuesta?.sucursal?.equipos ?? [];
          this.equipos = updatedEquipos;
          this.obtainedEquipments = true;
          this.checkboxesState = new Array(updatedEquipos.length).fill(false);
          this.loaderService.hideModal();
        },
        error: (error) => {
          console.error('Error al actualizar la tabla de equipos:', error);
          this.loaderService.hideModal();
        }
      });
    }
  }

  checkboxSeleccionado(): boolean {
    if (this.checkboxesState.length === 0) return false;
    return this.checkboxesState.every((state) => state);
  }

  seleccionarTodo(event: MouseEvent): void {
    const checkbox = event.currentTarget as HTMLInputElement;

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (checkboxes) {
      const allCheckboxes = Array.from(checkboxes).slice(1);

      if (checkbox.checked) {
        allCheckboxes.forEach((checkbox) => {
          const check = checkbox as HTMLInputElement;
          check.checked = true;
        });
        this.selectedDevices = this.equipos!.map((equipo) => ({
          codigoId: equipo.codigoId,
          fechaIngreso: equipo.fechaIngreso,
          departamento: equipo.departamento,
        }));
        this.checkboxesState.fill(checkbox.checked);
        this.enviarEquipos();
      } else {
        allCheckboxes.forEach((checkbox) => {
          const check = checkbox as HTMLInputElement;
          check.checked = false;
        });
        this.selectedDevices = [];
        this.checkboxesState.fill(checkbox.checked);
        this.enviarEquipos();
      }
    }
  }

  enviarEquipos(): void {
    this.Devices.emit([...this.selectedDevices]);
  }

  parseInt(value: string): number {
    return parseInt(value);
  }
}

