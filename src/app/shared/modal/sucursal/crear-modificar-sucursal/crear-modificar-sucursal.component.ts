import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';
import { EstadoSucursal } from '../../../../interfaces/estado-sucursal.interface';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'shared-crear-modificar-sucursal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputTelefonoDirective],
  templateUrl: './crear-modificar-sucursal.component.html',
  styleUrl: './crear-modificar-sucursal.component.css'
})
export class CrearModificarSucursalComponent implements OnInit {
  getNombreEstado(estadoId: number): string {
    const estado = this.estadosSucursal.find(e => e.id == estadoId);
    return estado ? estado.name : '';
  }
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  @Input() casaMatrizId!: string;
  @Input() idSucursal?: string;
  @Input() sucursal?: Sucursal;
  public creating!: boolean;

  public boton_texto!: string;
  public isVisible: boolean = true;
  public sucursalForm: FormGroup;
  public errorMessage: string = '';
  
  // Estados de sucursales
  public estadosSucursal: EstadoSucursal[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.sucursalForm = this.fb.group({
      sucursal: ['', Validators.required],
      direccion: ['', Validators.required],
      encargadoSucursal: ['', Validators.required],
      correoSucursal: ['', [Validators.required, Validators.email]],
      telefonoSucursal: ['', [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')]],
      estado: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Cargar los estados de sucursales
    this.cargarEstadosSucursal();
    
    if(this.idSucursal && this.sucursal) {
      this.boton_texto = 'Modificar sucursal';
      this.sucursalForm.addControl('sucursalId', new FormControl('', [Validators.required]));

      this.sucursalForm.patchValue({
        sucursalId: this.sucursal.id,
        sucursal: this.sucursal.sucursal,
        direccion: this.sucursal.direccion,
        encargadoSucursal: this.sucursal.encargadoSucursal,
        correoSucursal: this.sucursal.correoSucursal,
        telefonoSucursal: this.sucursal.telefonoSucursal,
        estado: this.sucursal.estado
      });
    } else {
      this.boton_texto = 'Añadir sucursal';
      this.sucursalForm.addControl('casaMatrizId', new FormControl('', [Validators.required]));

      // Para nuevas sucursales, establecer el estado por defecto a 1 (Activa)
      this.sucursalForm.patchValue({
        casaMatrizId: this.casaMatrizId,
        estado: 1 // Estado por defecto: Activa
      });
    }
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.sucursalForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.sucursalForm.valid) {
      this.creating = true;

      this.enviarFormulario.emit(this.sucursalForm.value);
      // this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
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
}
