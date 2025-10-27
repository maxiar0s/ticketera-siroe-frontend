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
import { DepartamentoEquipo } from '../../../../interfaces/departamento-equipo.interface';

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
    esArriendo: [false],
  });
  // Espera para cargar el titulo del modal
  public headerCharged: boolean = false;
  // Espera para body del modal
  public formCharged: boolean = false;

  // Obtiene el ID del equipo
  @Input() idEquipo!: number;
  @Input() permiteArriendo: boolean = false;

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
  public departamentos: DepartamentoEquipo[] = [];

  // Estados de equipo
  public estadosEquipo: EstadoEquipo[] = [];

  public isVisible: boolean = true;
  public errorMessage: string = '';
  public originalFormValues: any = {};
  public soloEstadoModificado: boolean = false;
  private departamentoOriginal: string | null = null;

  constructor(
    private fb: FormBuilder,
    public loaderService: LoaderService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loaderService.showModal();

    // Cargar los estados de equipo
    this.cargarEstadosEquipo();
    this.cargarDepartamentos();

    this.apiService.equiptment(this.idEquipo).subscribe({
      next: (respuesta) => {
        this.equipo = respuesta;

        this.headerCharged = true;
        this.tipoEquipoActual = respuesta.tipoEquipoId;
        this.departamentoOriginal = respuesta.departamento ?? null;

        this.apiService.formEquipment(this.tipoEquipoActual).subscribe({
          next: (campos) => {
            const camposSinDuplicados = this.eliminarDuplicados(campos, 'name');

            this.camposDinamicos = camposSinDuplicados.map((campo) =>
              campo.name === 'cantidadAlmacenamiento'
                ? { ...campo, label: 'Capacidad de Almacenamiento (GB)' }
                : campo
            );

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

  cargarDepartamentos() {
    this.apiService.getDepartamentosEquipo().subscribe({
      next: (departamentos) => {
        this.departamentos = departamentos;
        this.establecerDepartamentoEnFormulario();
      },
      error: (error) => {
        console.error('Error al cargar los departamentos de equipo:', error);
      },
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
    const controlesProtegidos = new Set(['id', 'estado', 'text', 'departamentoId', 'esArriendo']);

    controlesActuales.forEach((controlName) => {
      if (controlesProtegidos.has(controlName)) {
        return;
      }
      if (!campos.find((campo) => campo.name === controlName)) {
        this.equipoForm.removeControl(controlName);
      }
    });

    if (!this.equipoForm.contains('id')) {
      const control = new FormControl('', Validators.required);
      this.equipoForm.addControl('id', control);
    }
    this.equipoForm.patchValue({
      id: this.idEquipo,
    });

    // Agregar control para el estado del equipo
    const estadoControl = new FormControl(respuesta.estado || '', Validators.required);
    this.equipoForm.addControl('estado', estadoControl);

    const text = new FormControl('');
    this.equipoForm.addControl('text', text);

    if (!this.equipoForm.contains('departamentoId')) {
      const departamentoControl = new FormControl('', Validators.required);
      this.equipoForm.addControl('departamentoId', departamentoControl);
    }

    if (!this.equipoForm.contains('esArriendo')) {
      const arriendoControl = new FormControl(false);
      this.equipoForm.addControl('esArriendo', arriendoControl);
    }

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

    const arriendoControl = this.equipoForm.get('esArriendo');
    if (arriendoControl) {
      arriendoControl.setValue(this.permiteArriendo ? !!respuesta.esArriendo : false);
    }

    this.establecerDepartamentoEnFormulario();
  }

  private establecerDepartamentoEnFormulario(): void {
    if (!this.equipoForm.contains('departamentoId')) {
      return;
    }

    const control = this.equipoForm.get('departamentoId');
    if (!control) {
      return;
    }

    if (!this.departamentos.length) {
      return;
    }

    if (!this.departamentoOriginal) {
      control.setValue('');
      return;
    }

    const normalizar = (valor: string) => valor.trim().toLowerCase();
    const objetivo = normalizar(this.departamentoOriginal);

    const coincidencia = this.departamentos.find(
      (item) => normalizar(item.name) === objetivo
    );

    if (coincidencia) {
      control.setValue(coincidencia.id.toString());
      control.markAsPristine();
      control.updateValueAndValidity({ emitEvent: false });
    } else {
      control.setValue('');
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.equipoForm.reset();
    this.equipoForm.patchValue({ esArriendo: false });
    this.errorMessage = '';
    this.selectedFile = null;
    this.soloEstadoModificado = false;
    this.departamentoOriginal = null;
    this.originalFormValues = {};
    this.cerrarModal.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input!.files![0];
  }

  onSubmit() {
    if (!this.equipoForm.valid) {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }

    const valoresActuales = this.equipoForm.value;
    const nuevoEstado = valoresActuales.estado;
    const comentario = (valoresActuales.text || '').trim();
    const estadoOriginal = this.originalFormValues.estado;

    const hayArchivoNuevo = !!this.selectedFile;
    const hayCambiosFormulario = this.existenCambiosEnCampos(valoresActuales);
    let emitioActualizacion = false;

    if (hayCambiosFormulario || hayArchivoNuevo) {
      const formData = this.construirPayloadFormulario(valoresActuales);
      this.enviarFormulario.emit(formData);
      this.equipoActualizado.emit(true);
      emitioActualizacion = true;
    }

    if (
      nuevoEstado !== undefined &&
      nuevoEstado !== null &&
      nuevoEstado !== '' &&
      nuevoEstado !== estadoOriginal
    ) {
      this.apiService.actualizarEstadoEquipo(this.idEquipo, nuevoEstado).subscribe({
        next: () => {
          console.log('Estado del equipo actualizado correctamente');
          if (!emitioActualizacion) {
            this.equipoActualizado.emit(true);
          }
        },
        error: (error) => {
          console.error('Error al actualizar el estado del equipo:', error);
        }
      });
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

  private construirPayloadFormulario(valoresActuales: any): FormData {
    const formData = new FormData();

    Object.keys(valoresActuales).forEach((key) => {
      if (key === 'estado' || key === 'imagen' || key === 'text') {
        return;
      }

      const rawValue = valoresActuales[key];
      const normalizedValue = this.normalizarValorCampo(key, rawValue);

      if (normalizedValue !== null) {
        formData.append(key, normalizedValue);
      }
    });

    const idControl = valoresActuales.id;
    if (idControl !== undefined && idControl !== null && idControl !== '') {
      formData.append('id', idControl.toString());
    }

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    return formData;
  }

  private existenCambiosEnCampos(valoresActuales: any): boolean {
    return Object.keys(valoresActuales).some((key) => {
      if (key === 'estado' || key === 'text') {
        return false;
      }

      return valoresActuales[key] !== this.originalFormValues[key];
    });
  }

  verificarSoloEstadoModificado() {
    if (!this.originalFormValues || !Object.keys(this.originalFormValues).length) {
      this.soloEstadoModificado = false;
      return;
    }

    const currentValues = this.equipoForm.value;
    const estadoOriginal = this.originalFormValues.estado;
    const estadoActual = currentValues.estado;

    const hayCambiosOtrosCampos = Object.keys(currentValues).some((key) => {
      if (key === 'estado' || key === 'text') {
        return false;
      }

      return currentValues[key] !== this.originalFormValues[key];
    });

    this.soloEstadoModificado =
      estadoActual !== estadoOriginal && !hayCambiosOtrosCampos;
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





