import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TipoEquipo } from '../../../interfaces/TipoEquipo.interface';
import { Campo } from '../../../interfaces/campo.interface';
import { ApiService } from '../../../services/api.service';
import { LoaderService } from '../../../services/loader.service';
import { SignalService } from '../../../services/signal.service';
import { NavegationComponent } from '../../../shared/navegation/navegation.component';

@Component({
  selector: 'app-tipos-equipos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavegationComponent],
  templateUrl: './tipos-equipos.component.html',
  styleUrl: './tipos-equipos.component.css',
})
export class TiposEquiposComponent implements OnInit {
  public tipos: TipoEquipo[] = [];
  public campos: Campo[] = [];

  public selectedTipo: TipoEquipo | null = null;

  public crearTipoForm: FormGroup;
  public editarTipoForm: FormGroup;
  public campoForm: FormGroup;

  public creandoTipo = false;
  public actualizandoTipo = false;
  public eliminandoTipo = false;
  public sincronizandoCampos = false;
  public guardandoCampo = false;

  public mostrarModalCampos = false;
  public modalCargando = false;

  public camposInicialesSeleccionados = new Set<number>();

  public mensajeCreacion = '';
  public errorCreacion = '';
  public mensajeTipo = '';
  public errorTipo = '';
  public mensajeCampos = '';
  public errorCampos = '';
  public mensajeCampo = '';
  public errorCampo = '';

  private camposSeleccionados = new Set<number>();
  private camposSeleccionadosOriginal = new Set<number>();
  public camposDirty = false;
  public campoEnEdicion: Campo | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly fb: FormBuilder,
    public readonly loaderService: LoaderService,
    private readonly signalService: SignalService
  ) {
    this.crearTipoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      dict: ['', [Validators.required, Validators.maxLength(6)]],
      campoIds: this.fb.control<number[]>([], { nonNullable: true }),
    });

    this.editarTipoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      dict: ['', [Validators.required, Validators.maxLength(6)]],
    });

    this.campoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      label: ['', [Validators.required, Validators.minLength(3)]],
      type: ['text', [Validators.required]],
      placeholder: [''],
      required: [false],
    });
  }

  ngOnInit(): void {
    this.signalService.updateData('Tipos de equipos');
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.loaderService.showSection();
    forkJoin({
      tipos: this.apiService.typeEquipments(),
      campos: this.apiService.getCamposCatalog(),
    })
      .pipe(finalize(() => this.loaderService.hideSection()))
      .subscribe({
        next: ({ tipos, campos }) => {
          this.tipos = Array.isArray(tipos) ? tipos : [];
          this.campos = Array.isArray(campos) ? campos : [];
          const inicialesValidos = Array.from(this.camposInicialesSeleccionados).filter((id) =>
            this.campos.some((campo) => campo.id === id)
          );
          this.camposInicialesSeleccionados = new Set(inicialesValidos);
          this.crearTipoForm.get('campoIds')?.setValue(inicialesValidos);
          if (this.selectedTipo) {
            const existente = this.tipos.find((tipo) => tipo.id === this.selectedTipo?.id);
            if (existente) {
              this.seleccionarTipo(existente);
            } else {
              this.selectedTipo = null;
              this.camposSeleccionados.clear();
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar los tipos de equipos:', error);
          this.errorTipo =
            error?.error?.error ??
            'No se pudo cargar la información de tipos de equipos.';
        },
      });
  }

  seleccionarTipo(tipo: TipoEquipo, mostrarModalCampos = false): void {
    if (!tipo) {
      return;
    }

    this.selectedTipo = tipo;
    this.editarTipoForm.patchValue({
      name: tipo.name,
      dict: tipo.dict,
    });
    this.mensajeTipo = '';
    this.errorTipo = '';
    this.cargarCamposDelTipo(tipo.id, mostrarModalCampos);
  }

  private cargarCamposDelTipo(
    tipoId: number,
    mostrarModalCampos = false
  ): void {
    const usandoModal = !!mostrarModalCampos;

    if (usandoModal) {
      this.modalCargando = true;
      this.mostrarModalCampos = true;
    } else {
      this.loaderService.showSection();
    }

    this.apiService
      .getEquipmentTypeFields(tipoId)
      .pipe(
        finalize(() => {
          if (usandoModal) {
            this.modalCargando = false;
          } else {
            this.loaderService.hideSection();
          }
        })
      )
      .subscribe({
        next: (campos) => {
          const lista = Array.isArray(campos) ? campos : [];
          const ids = new Set(lista.map((campo) => campo.id));
          this.camposSeleccionados = ids;
          this.camposSeleccionadosOriginal = new Set(ids);
          this.camposDirty = false;
          this.mensajeCampos = '';
          this.errorCampos = '';
          if (mostrarModalCampos) {
            this.mostrarModalCampos = true;
          }
        },
        error: (error) => {
          console.error('Error al obtener campos del tipo:', error);
          this.errorCampos =
            error?.error?.error ??
            'No se pudieron obtener los campos del tipo seleccionado.';
          this.camposSeleccionados.clear();
          this.camposSeleccionadosOriginal.clear();
          this.camposDirty = false;
          if (usandoModal) {
            this.mostrarModalCampos = false;
          }
        },
      });
  }

  crearTipo(): void {
    if (this.crearTipoForm.invalid) {
      this.crearTipoForm.markAllAsTouched();
      return;
    }

    const { name, dict } = this.crearTipoForm.value;
    const campoIds = Array.from(this.camposInicialesSeleccionados);
    const payload = {
      name: name?.trim(),
      dict: dict?.trim(),
      campoIds,
    };

    this.creandoTipo = true;
    this.mensajeCreacion = '';
    this.errorCreacion = '';

    this.apiService
      .createEquipmentType(payload)
      .pipe(finalize(() => (this.creandoTipo = false)))
      .subscribe({
        next: (tipo) => {
          this.tipos = [...this.tipos, tipo];
          this.crearTipoForm.reset({
            name: '',
            dict: '',
            campoIds: [],
          });
          this.camposInicialesSeleccionados.clear();
          this.mensajeCreacion = 'Tipo de equipo creado correctamente.';
        },
        error: (error) => {
          console.error('Error al crear tipo de equipo:', error);
          this.errorCreacion =
            error?.error?.error ??
            'No se pudo crear el tipo de equipo. Inténtalo nuevamente.';
        },
      });
  }

  cerrarModalCampos(): void {
    this.camposSeleccionados = new Set(this.camposSeleccionadosOriginal);
    this.camposDirty = false;
    this.mensajeCampos = '';
    this.errorCampos = '';
    this.mostrarModalCampos = false;
    this.modalCargando = false;
  }

  actualizarTipo(): void {
    if (!this.selectedTipo) {
      return;
    }

    if (this.editarTipoForm.invalid) {
      this.editarTipoForm.markAllAsTouched();
      return;
    }

    const { name, dict } = this.editarTipoForm.value;
    const payload: {
      name?: string;
      dict?: string;
    } = {};

    if (name && name.trim() && name.trim() !== this.selectedTipo.name) {
      payload.name = name.trim();
    }

    if (dict && dict.trim() && dict.trim() !== this.selectedTipo.dict) {
      payload.dict = dict.trim();
    }

    if (!Object.keys(payload).length) {
      this.mensajeTipo = 'No hay cambios para guardar.';
      return;
    }

    this.actualizandoTipo = true;
    this.mensajeCreacion = '';
    this.errorCreacion = '';
    this.mensajeTipo = '';
    this.errorTipo = '';

    this.apiService
      .updateEquipmentType(this.selectedTipo.id, payload)
      .pipe(finalize(() => (this.actualizandoTipo = false)))
      .subscribe({
        next: (actualizado) => {
          this.tipos = this.tipos.map((tipo) =>
            tipo.id === actualizado.id ? actualizado : tipo
          );
          this.selectedTipo = actualizado;
          this.mensajeTipo = 'Tipo de equipo actualizado correctamente.';
        },
        error: (error) => {
          console.error('Error al actualizar tipo de equipo:', error);
          this.errorTipo =
            error?.error?.error ??
            'No se pudo actualizar el tipo de equipo. Inténtalo nuevamente.';
        },
      });
  }

  eliminarTipo(tipo: TipoEquipo, event?: Event): void {
    event?.stopPropagation();

    if (!tipo) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar el tipo de equipo "${tipo.name}"?`
    );

    if (!confirmar) {
      return;
    }

    this.eliminandoTipo = true;
    this.mensajeTipo = '';
    this.errorTipo = '';

    this.apiService
      .deleteEquipmentType(tipo.id)
      .pipe(finalize(() => (this.eliminandoTipo = false)))
      .subscribe({
        next: () => {
          this.tipos = this.tipos.filter((item) => item.id !== tipo.id);
          if (this.selectedTipo?.id === tipo.id) {
            this.selectedTipo = null;
            this.editarTipoForm.reset();
            this.camposSeleccionados.clear();
            this.camposSeleccionadosOriginal.clear();
            this.mostrarModalCampos = false;
          }
          this.mensajeTipo = 'Tipo de equipo eliminado correctamente.';
        },
        error: (error) => {
          console.error('Error al eliminar tipo de equipo:', error);
          const mensaje =
            error?.error?.error ??
            'No se pudo eliminar el tipo de equipo. Verifica que no tenga equipos asociados.';
          this.errorTipo = mensaje;
          window.alert(mensaje);
        },
      });
  }

  toggleCampo(campoId: number, checked: boolean): void {
    if (checked) {
      this.camposSeleccionados.add(campoId);
    } else {
      this.camposSeleccionados.delete(campoId);
    }
    this.camposDirty = true;
    this.mensajeCampos = '';
    this.errorCampos = '';
  }

  toggleCampoInicial(campoId: number, checked: boolean): void {
    if (checked) {
      this.camposInicialesSeleccionados.add(campoId);
    } else {
      this.camposInicialesSeleccionados.delete(campoId);
    }
    this.crearTipoForm.get('campoIds')?.setValue(Array.from(this.camposInicialesSeleccionados));
  }

  campoInicialSeleccionado(id: number): boolean {
    return this.camposInicialesSeleccionados.has(id);
  }

  guardarCamposTipo(): void {
    if (!this.selectedTipo) {
      return;
    }

    this.sincronizandoCampos = true;
    this.mensajeCampos = '';
    this.errorCampos = '';

    const campoIds = Array.from(this.camposSeleccionados);

      this.apiService
        .updateEquipmentTypeFields(this.selectedTipo.id, campoIds)
        .pipe(finalize(() => (this.sincronizandoCampos = false)))
        .subscribe({
          next: (campos) => {
            const lista = Array.isArray(campos) ? campos : [];
            const ids = new Set(lista.map((campo) => campo.id));
            this.camposSeleccionados = ids;
            this.camposSeleccionadosOriginal = new Set(ids);
            this.camposDirty = false;
            this.mensajeCampos = 'Campos actualizados correctamente.';
            this.errorCampos = '';
          },
          error: (error) => {
            console.error('Error al sincronizar campos:', error);
            this.errorCampos =
              error?.error?.error ??
            'No se pudieron actualizar los campos del tipo.';
        },
      });
  }

  editarCampo(campo: Campo): void {
    this.campoEnEdicion = campo;
    this.campoForm.reset({
      name: campo.name,
      label: campo.label,
      type: campo.type,
      placeholder: campo.placeholder ?? '',
      required: campo.required,
    });
    this.mensajeCampo = '';
    this.errorCampo = '';
  }

  cancelarEdicionCampo(): void {
    this.campoEnEdicion = null;
    this.campoForm.reset({
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
    });
    this.mensajeCampo = '';
    this.errorCampo = '';
  }

  enviarCampo(): void {
    if (this.campoForm.invalid) {
      this.campoForm.markAllAsTouched();
      return;
    }

    const { name, label, type, placeholder, required } =
      this.campoForm.value;

    const payload = {
      name: name?.trim(),
      label: label?.trim(),
      type: type?.trim(),
      placeholder: placeholder?.trim() || null,
      required: !!required,
    };

    this.guardandoCampo = true;
    this.mensajeCampo = '';
    this.errorCampo = '';

    const request$ = this.campoEnEdicion
      ? this.apiService.updateCampo(this.campoEnEdicion.id, payload)
      : this.apiService.createCampo(payload);

    request$
      .pipe(finalize(() => (this.guardandoCampo = false)))
      .subscribe({
        next: (campo) => {
          if (this.campoEnEdicion) {
            this.campos = this.campos.map((item) =>
              item.id === campo.id ? campo : item
            );
            if (this.camposSeleccionados.has(campo.id)) {
              this.camposDirty = true;
            }
            this.mensajeCampo = 'Campo actualizado correctamente.';
          } else {
            this.campos = [...this.campos, campo];
            this.mensajeCampo = 'Campo creado correctamente.';
          }

          this.campoEnEdicion = null;
          this.campoForm.reset({
            name: '',
            label: '',
            type: 'text',
            placeholder: '',
            required: false,
          });
        },
        error: (error) => {
          console.error('Error al guardar el campo:', error);
          this.errorCampo =
            error?.error?.error ??
            'No se pudo guardar el campo. Inténtalo nuevamente.';
        },
      });
  }

  eliminarCampo(campo: Campo): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar el campo "${campo.label}"?`
    );

    if (!confirmar) {
      return;
    }

    this.guardandoCampo = true;
    this.mensajeCampo = '';
    this.errorCampo = '';

    this.apiService
      .deleteCampo(campo.id)
      .pipe(finalize(() => (this.guardandoCampo = false)))
      .subscribe({
        next: () => {
          this.campos = this.campos.filter((item) => item.id !== campo.id);
          if (this.camposSeleccionados.delete(campo.id)) {
            this.camposDirty = true;
          }
          this.camposSeleccionadosOriginal.delete(campo.id);
          if (this.campoEnEdicion?.id === campo.id) {
            this.cancelarEdicionCampo();
          }
          this.mensajeCampo = 'Campo eliminado correctamente.';
        },
        error: (error) => {
          console.error('Error al eliminar el campo:', error);
          const mensaje =
            error?.error?.error ??
            'No se pudo eliminar el campo. Verifica que no esté asignado a un tipo.';
          this.errorCampo = mensaje;
          window.alert(mensaje);
        },
      });
  }

  campoSeleccionado(id: number): boolean {
    return this.camposSeleccionados.has(id);
  }
}
