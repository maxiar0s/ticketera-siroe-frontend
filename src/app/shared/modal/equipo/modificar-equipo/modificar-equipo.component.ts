import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoaderService } from '../../../../services/loader.service';
import { ApiService } from '../../../../services/api.service';
import { Equipo } from '../../../../interfaces/equipo.interface';
import { EquipoFormField } from '../../../../interfaces/EquipoForm.interface';
import { LoaderModalComponent } from '../../../loader-modal/loader-modal.component';
import { EstadoEquipo } from '../../../../interfaces/estado-equipo.interface';

// ! #FIXME: Error al actualizar estado de equipo y actualizar el equipo

@Component({
  selector: 'shared-modificar-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoaderModalComponent],
  templateUrl: './modificar-equipo.component.html',
  styleUrl: './modificar-equipo.component.css',
})
export class ModificarEquipoComponent {
  // Form group general
  public selectedFile: File | null = null;
  public equipoForm: FormGroup = this.fb.group({
    id: ['', Validators.required],
  });
  // Espera para cargar el titulo del modal
  public headerCharged: boolean = false;
  // Espera para body del modal
  public formCharged: boolean = false;

  // Obtiene el ID del equipo
  @Input() idEquipo!: number;

  // Control del modal
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<FormData>();

  //* Informar al padre de la actualizacion de equipo
  @Output() equipoActualizado = new EventEmitter<boolean>();

  // Equipo opcional en caso de si existe ID
  public equipo!: Equipo;

  // Tipo del equipo
  public tipoEquipoActual: string = '';
  public camposDinamicos: EquipoFormField[] = [];

  // Estados de equipo
  public estadosEquipo: EstadoEquipo[] = [];

  public isVisible: boolean = true;
  public errorMessage: string = '';
  public originalFormValues: any = {};
  public soloEstadoModificado: boolean = false;

  constructor(
    private fb: FormBuilder,
    public loaderService: LoaderService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loaderService.showModal();

    // Cargar los estados de equipo
    this.cargarEstadosEquipo();

    this.apiService.equiptment(this.idEquipo).subscribe({
      next: (respuesta) => {
        this.equipo = respuesta;

        this.headerCharged = true;
        this.tipoEquipoActual = respuesta.tipoEquipoId;

        this.apiService.formEquipment(this.tipoEquipoActual).subscribe({
          next: (campos) => {
            const camposSinDuplicados = this.eliminarDuplicados(campos, 'name');
            this.camposDinamicos = camposSinDuplicados;

            this.actualizarFormularioConCampos(campos, respuesta);
            this.loaderService.hideModal();
            this.formCharged = true;

            // Guardar los valores originales del formulario
            this.originalFormValues = {...this.equipoForm.value};

            // Suscribirse a los cambios del formulario para detectar si solo se modificó el estado
            this.equipoForm.valueChanges.subscribe(() => {
              this.verificarSoloEstadoModificado();
            });

            console.log(this.camposDinamicos);
          },
          error: (error) => {
            console.error('Error al obtener los campos', error);
            this.loaderService.hideModal();
          },
        });
      },
      error: (error) => {
        console.error('Error al obtener el equipo', error);
        this.loaderService.hideModal();
      },
    });
  }

  cargarEstadosEquipo() {
    this.apiService.getEstadosEquipo().subscribe({
      next: (estados) => {
        this.estadosEquipo = estados;
      },
      error: (error) => {
        console.error('Error al cargar los estados de equipo:', error);
      }
    });
  }

  eliminarDuplicados(array: any[], prop: string): any[] {
    return array.filter(
      (obj, index, self) =>
        index === self.findIndex((o) => o[prop] === obj[prop])
    );
  }

  actualizarFormularioConCampos(
    campos: EquipoFormField[],
    respuesta: any
  ): void {
    const controlesActuales = Object.keys(this.equipoForm.controls);

    controlesActuales.forEach((controlName) => {
      if (!campos.find((campo) => campo.name === controlName)) {
        this.equipoForm.removeControl(controlName);
      }
    });

    const control = new FormControl('', Validators.required);
    this.equipoForm.addControl('id', control);
    this.equipoForm.patchValue({
      id: this.idEquipo,
    });

    // Agregar control para el estado del equipo
    const estadoControl = new FormControl(respuesta.estado || '', Validators.required);
    this.equipoForm.addControl('estado', estadoControl);

    const text = new FormControl('');
    this.equipoForm.addControl('text', text);

    campos.forEach((campo) => {
      if (!this.equipoForm.contains(campo.name)) {
        const control = new FormControl('');
        this.equipoForm.addControl(campo.name, control);
      }

      if (
        respuesta[campo.name] !== null &&
        respuesta[campo.name] !== undefined
      ) {
        if (campo.name !== 'imagen') {
          this.equipoForm.patchValue({
            [campo.name]: respuesta[campo.name],
          });
        }
      }
    });
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.equipoForm.reset();
    this.errorMessage = '';
    this.selectedFile = null;
    this.soloEstadoModificado = false;
    this.cerrarModal.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input!.files![0];
  }

  onSubmit() {
    if (this.equipoForm.valid) {
      const nuevoEstado = this.equipoForm.value.estado;
      const comentario = (this.equipoForm.value.text || '').trim();

      if (this.soloEstadoModificado) {
        this.actualizarSoloEstado();
      } else {
        const formData = new FormData();

        Object.keys(this.equipoForm.value).forEach((key) => {
          if (key === 'estado' || key === 'imagen' || key === 'text') {
            return;
          }

          const rawValue = this.equipoForm.value[key];
          const normalizedValue = this.normalizarValorCampo(key, rawValue);

          if (normalizedValue !== null) {
            formData.append(key, normalizedValue);
          }
        });

        const idControl = this.equipoForm.get('id')?.value;
        if (idControl !== undefined && idControl !== null && idControl !== '') {
          formData.append('id', idControl.toString());
        }

        if (this.selectedFile) {
          formData.append('imagen', this.selectedFile);
        }

        this.enviarFormulario.emit(formData);

        this.equipoActualizado.emit(true);

        if (nuevoEstado) {
          this.apiService.actualizarEstadoEquipo(this.idEquipo, nuevoEstado).subscribe({
            next: () => {
              console.log('Estado del equipo actualizado correctamente');
            },
            error: (error) => {
              console.error('Error al actualizar el estado del equipo:', error);
            }
          });
        }
      }

      if (comentario !== '') {
        const observacion = {
          equipoId: this.idEquipo,
          text: comentario,
        };
        this.apiService.createComment(observacion).subscribe({
          next: (respuesta) => {
            console.log(respuesta);
          },
          error: (error) => {
            console.error('Error al crear observacion', error);
          },
        });
      }
      this.cerrar();
    } else {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  private normalizarValorCampo(key: string, valor: any): string | null | Blob {
    if (valor === undefined || valor === null) {
      return null;
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim();

      if (key === 'ram' || key === 'cantidadAlmacenamiento') {
        if (trimmed === '' || trimmed.toLowerCase() === 'null') {
          return '';
        }

        const numero = parseInt(trimmed, 10);
        return Number.isNaN(numero) ? trimmed : numero.toString();
      }

      if (trimmed === '' || trimmed.toLowerCase() === 'null') {
        return '';
      }

      return trimmed;
    }

    return valor;
  }
  verificarSoloEstadoModificado() {
    // Verificar si solo se ha modificado el estado y/o el campo de observaciones
    const currentValues = this.equipoForm.value;
    this.soloEstadoModificado = true;

    // Comparar cada campo excepto estado y text (observaciones)
    Object.keys(currentValues).forEach(key => {
      if (key !== 'estado' && key !== 'text') {
        // Si algún campo que no sea estado o text ha cambiado, no es solo modificación de estado
        if (currentValues[key] !== this.originalFormValues[key]) {
          this.soloEstadoModificado = false;
        }
      }
    });

    // Verificar si el estado ha cambiado
    if (currentValues.estado === this.originalFormValues.estado) {
      // Si el estado no cambió pero solo se modificó el campo de observaciones,
      // seguimos considerando que solo se modificó el estado
      if (currentValues.text !== this.originalFormValues.text && currentValues.text !== '') {
        this.soloEstadoModificado = true;
      } else {
        this.soloEstadoModificado = false;
      }
    }
  }

  actualizarSoloEstado() {
    const nuevoEstado = this.equipoForm.value.estado;
    if (nuevoEstado) {
      this.apiService.actualizarEstadoEquipo(this.idEquipo, nuevoEstado).subscribe({
        next: () => {
          console.log('Estado del equipo actualizado correctamente');
          this.cerrarModal.emit();
        },
        error: (error) => {
          console.error('Error al actualizar el estado del equipo:', error);
        }
      });
    }
  }
}





