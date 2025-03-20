import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/equipo/modificar-equipo/modificar-equipo.component';
import { LoaderService } from '../../../services/loader.service';
import { FormatoFechaPipe } from '../../../pipes/formato-fecha.pipe';
import { ImprimirEquipo } from '../../../interfaces/ImprimirEquipo.interface';
import { VerInformacionComponent } from '../../../shared/modal/equipo/ver-informacion/ver-informacion.component';

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

  // Evento para notificar cuando se elimina un equipo
  @Output() equipoEliminado = new EventEmitter<void>();

  constructor(
    private apiService: ApiService,
    public loaderService: LoaderService
  ) {}

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
