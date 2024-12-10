import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { ModificarEquipoComponent } from '../../../shared/modal/modificar-equipo/modificar-equipo.component';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule, ModificarEquipoComponent, LoaderComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  // Oculta la informacion hasta que se carga
  public obtainedEquipments: boolean = false;
  @Output() hideNavegation = new EventEmitter<boolean>;

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
    private loaderService: LoaderService
  ) {  }

  ngOnInit() {
    this.loaderService.showSection();
    this.apiService.equipmentsBySucursal(this.id).subscribe({
      next: (respuesta) => {
        this.equipos = respuesta;
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
}
