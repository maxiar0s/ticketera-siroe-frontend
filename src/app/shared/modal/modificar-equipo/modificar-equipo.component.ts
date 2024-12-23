import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../../services/loader.service';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { EquipoFormConfig } from './EquipoFormConfig';
import { EquipoFormField } from '../../../interfaces/EquipoForm.interface';
import { LoaderModalComponent } from '../../loader-modal/loader-modal.component';

@Component({
  selector: 'shared-modificar-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoaderModalComponent],
  templateUrl: './modificar-equipo.component.html',
  styleUrl: './modificar-equipo.component.css'
})
export class ModificarEquipoComponent {
  // Form group general
  public equipoForm: FormGroup = this.fb.group({
    id: ['', Validators.required]
  });
  // Llaves de los tipos de equipo
  tiposEquipo: string[] = Object.keys(EquipoFormConfig);
  // Espera para cargar el titulo del modal
  public headerCharged: boolean = false;
  // Obtiene el ID del equipo
  @Input() idEquipo!: number;
  // Control del modal
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();
  // Equipo opcional en caso de si existe ID
  public equipo?: Equipo;
  // Tipo del equipo
  public tipoEquipoActual: string = '';
  public camposDinamicos: EquipoFormField[] = [];

  public isVisible: boolean = true;
  public errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    public loaderService: LoaderService,
    private apiService: ApiService,
  ) { }

  ngOnInit() {
    this.loaderService.showModal()
    this.apiService.equiptment(this.idEquipo).subscribe({
      next: (respuesta) => {
        this.equipo = respuesta;

        this.equipoForm.patchValue({
          id: this.idEquipo
        });

        this.headerCharged = true;
        this.tipoEquipoActual = respuesta.tipo;
        this.actualizarCamposDinamicos(this.tipoEquipoActual);

        this.camposDinamicos.forEach(campo => {
          if (respuesta[campo.name] !== null && respuesta[campo.name] !== undefined) {
            this.equipoForm.patchValue({
              [campo.name]: respuesta[campo.name]
            });
          }
        });
        this.loaderService.hideModal();
      },
      error: (error) => {
        console.error('Error al obtener el equipo', error);
      }
    })
  }

  actualizarCamposDinamicos(tipo: string): void {
    this.camposDinamicos = EquipoFormConfig[tipo] || [];

    const controlesActuales = Object.keys(this.equipoForm.controls);
    controlesActuales.forEach(controlName => {
      if (this.camposDinamicos.find(campo => campo.name === controlName)) {
        this.equipoForm.removeControl(controlName);
      }
    });

    this.camposDinamicos.forEach(campo => {
      const control = new FormControl('', campo.validators || []);
      this.equipoForm.addControl(campo.name, control);
    });
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.equipoForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.equipoForm.valid) {
      this.enviarFormulario.emit(this.equipoForm.value);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
