import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/modificar-equipo/modificar-equipo.component';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { FormatoFechaPipe } from '../../../pipes/formato-fecha.pipe';
import { ActivatedRoute } from '@angular/router';
import { ImprimirEquipo } from '../../../interfaces/imprimir-equipo.interface';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule, ModificarEquipoComponent, LoaderComponent, FormatoFechaPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  // Arreglo de equipos
  public obtainedEquipments:  boolean = false;
  public equipos?:            Equipo[] = [];

  // Modal de edicion de equipo
  public selectedEquipoId!:   number;

  // Para modal de imprimir etiquetas
  public checkboxesState:     boolean[] = [];
  public selectedDevices:     ImprimirEquipo[] = [];
  @Output() Devices = new     EventEmitter<any>();

  // Modal
  public isModalVisible:    boolean = false;
  public successMessage:    string = '';
  public errorMessage:      string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public loaderService: LoaderService
  ) {  }

  @Input()
  set equiposRecibidos(value: Equipo[]) {
    this.equipos = value;
    this.checkboxesState = new Array(this.equipos.length).fill(false);
    this.obtainedEquipments = true;
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

  seleccionarEquipo(equipo: Equipo, codigoId: string, i: number): void {
    this.checkboxesState[i] = !this.checkboxesState[i];
    const index = this.selectedDevices.findIndex(device => device.codigoId === codigoId);

    if (index !== -1) {
      this.selectedDevices.splice(index, 1);
    } else {
      this.selectedDevices.push({
        codigoId: equipo.codigoId,
        fechaIngreso: equipo.fechaIngreso,
        departamento: equipo.departamento
      });
    }
    this.enviarEquipos();
  }

  checkboxSeleccionado(): boolean {
    return this.checkboxesState.every(state => state);
  }

  seleccionarTodo(event: MouseEvent): void {
    const checkbox = event.currentTarget as HTMLInputElement;

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if(checkboxes) {
      const allCheckboxes = Array.from(checkboxes).slice(1);

      if(checkbox.checked) {
        allCheckboxes.forEach(checkbox => {
          const check = checkbox as HTMLInputElement;
          check.checked = true;
        });
        this.selectedDevices = this.equipos!.map(equipo => ({
          codigoId: equipo.codigoId,
          fechaIngreso: equipo.fechaIngreso,
          departamento: equipo.departamento
        }));
        this.checkboxesState.fill(checkbox.checked);
        this.enviarEquipos();
      } else {
        allCheckboxes.forEach(checkbox => {
          const check = checkbox as HTMLInputElement;
          check.checked = false;
        });
        this.selectedDevices = [];
        this.checkboxesState.fill(checkbox.checked);
        this.enviarEquipos();
      }
    }
  }

  enviarEquipos():void {
    this.Devices.emit([...this.selectedDevices]);
  }
}
