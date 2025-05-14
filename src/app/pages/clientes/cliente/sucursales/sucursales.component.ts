import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';
import { EstadoSucursal } from '../../../../interfaces/estado-sucursal.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';
import { OpcionesSucursalComponent } from '../../../../shared/modal/sucursal/opciones-sucursal/opciones-sucursal.component';
import { CrearModificarSucursalComponent } from '../../../../shared/modal/sucursal/crear-modificar-sucursal/crear-modificar-sucursal.component';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';

@Component({
  selector: 'cliente-sucursales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe, OpcionesSucursalComponent, CrearModificarSucursalComponent],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent implements OnInit {
  @Input() esAdministrador!: boolean;

  // Arreglo de sucursales
  public obtainedSucursales: boolean = false;
  public sucursales: Sucursal[] | undefined = undefined;

  @Output() indiceTabla = new EventEmitter<any>();
  @Output() sucursalForm = new EventEmitter<any>();
  @Output() eliminarForm = new EventEmitter<any>();

  // Modal modificar o eliminar
  public selectedSucursal!: Sucursal;
  public idSucursal!: string;
  public indiceSucursal!: number;
  public isModalVisibleModificarSucursal: boolean = false;
  public isModalVisibleAjustesSucursal: boolean = false;

  // Estados de sucursales
  public estadosSucursal: EstadoSucursal[] = [];

  constructor(
    private apiService: ApiService,
    public loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    // Cargar los estados de sucursales al inicializar el componente
    this.cargarEstadosSucursal();
  }

  @Input()
  set setSucursales(value: Sucursal[]) {
    this.sucursales = value;
    this.obtainedSucursales = true;
  }

  abrirModModal(event: boolean) {
    this.isModalVisibleModificarSucursal = event;
  }

  abrirModalAjustesSucursal(indice: number) {
    if(this.sucursales) {
      this.idSucursal = this.sucursales[indice].id;
      this.selectedSucursal = this.sucursales[indice];
      this.indiceTabla.emit(indice);
      this.isModalVisibleAjustesSucursal = true;
    } else return;
  }

  cerrarModalAjustesSucursal() {
    this.isModalVisibleAjustesSucursal = false;
  }

  cerrarModalEditarSucursal() {
    this.isModalVisibleModificarSucursal = false;
  }

  enviarSucursal(event: any) {
    this.sucursalForm.emit(event);
  }

  eliminarSucursal(event: any) {
    this.eliminarForm.emit(event);
  }

  // Método para cargar los estados de sucursales
  cargarEstadosSucursal() {
    this.apiService.getEstadosSucursal().subscribe({
      next: (estados) => {
        this.estadosSucursal = estados;
        // Si no hay estados cargados desde la API, usar valores predeterminados
        if (!this.estadosSucursal || this.estadosSucursal.length === 0) {
          this.estadosSucursal = [
            { id: 1, name: 'Activa' },
            { id: 2, name: 'Inactiva' },
            { id: 3, name: 'Suspendida' }
          ];
        }
      },
      error: (error) => {
        console.error('Error al cargar estados de sucursales:', error);
        // En caso de error, usar valores predeterminados
        this.estadosSucursal = [
          { id: 1, name: 'Activa' },
          { id: 2, name: 'Inactiva' },
          { id: 3, name: 'Suspendida' }
        ];
      }
    });
  }

  // Método para obtener el nombre del estado según su ID
  getNombreEstado(estadoId: number): string {
    const estado = this.estadosSucursal.find(e => e.id === estadoId);
    return estado ? estado.name : 'Desconocido';
  }

  // Ya no necesitamos el método para cambiar el estado directamente
  // El estado se cambiará a través del modal de edición
}
