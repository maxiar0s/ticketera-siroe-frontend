import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { TipoEquipo } from '../../../interfaces/TipoEquipo.interface';
import { Campo, CampoPresetOption, CampoStandard, CampoColor } from '../../../interfaces/campo.interface';
import { DepartamentoEquipo } from '../../../interfaces/departamento-equipo.interface';
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
  public departamentos: DepartamentoEquipo[] = [];

  public selectedTipo: TipoEquipo | null = null;
  public departamentoSeleccionado: DepartamentoEquipo | null = null;

  public crearTipoForm: FormGroup;
  public editarTipoForm: FormGroup;
  public campoForm: FormGroup;
  public crearDepartamentoForm: FormGroup;
  public editarDepartamentoForm: FormGroup;

  public creandoTipo = false;
  public actualizandoTipo = false;
  public eliminandoTipo = false;
  public sincronizandoCampos = false;
  public guardandoCampo = false;
  public creandoDepartamento = false;
  public actualizandoDepartamento = false;
  public eliminandoDepartamento = false;

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
  public mensajeDepartamento = '';
  public errorDepartamento = '';
  public mensajeDepartamentos = '';
  public errorDepartamentos = '';

  private camposSeleccionados = new Set<number>();
  private camposSeleccionadosOriginal = new Set<number>();
  public camposDirty = false;
  public campoEnEdicion: Campo | null = null;

  public readonly coloresDisponibles = [
    { value: 'rojo' as CampoColor, label: 'Rojo · Obsoleto' },
    { value: 'amarillo' as CampoColor, label: 'Amarillo · Mínimo' },
    { value: 'verde' as CampoColor, label: 'Verde · Recomendado' },
  ];

  public readonly operadoresDisponibles = [
    { value: '', label: 'Referencia libre' },
    { value: 'eq', label: 'Igual (=)' },
    { value: 'gte', label: 'Mayor o igual (≥)' },
    { value: 'gt', label: 'Mayor que (>)' },
    { value: 'lte', label: 'Menor o igual (≤)' },
    { value: 'lt', label: 'Menor que (<)' },
    { value: 'contains', label: 'Contiene' },
    { value: 'regex', label: 'Coincide con expresión' },
  ];

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
      presetOptions: this.fb.array([]),
      standards: this.fb.array([]),
    });

    this.crearDepartamentoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.editarDepartamentoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  get presetOptionsArray(): FormArray {
    return this.campoForm.get('presetOptions') as FormArray;
  }

  get standardsArray(): FormArray {
    return this.campoForm.get('standards') as FormArray;
  }

  agregarOpcionPreset(data?: CampoPresetOption): void {
    this.presetOptionsArray.push(
      this.fb.group({
        label: [data?.label ?? '', [Validators.required, Validators.minLength(1)]],
        value: [data?.value ?? '', [Validators.required, Validators.minLength(1)]],
        color: [data?.color ?? 'amarillo'],
      })
    );
  }

  eliminarOpcionPreset(index: number): void {
    if (index < 0 || index >= this.presetOptionsArray.length) {
      return;
    }
    this.presetOptionsArray.removeAt(index);
  }

  agregarEstandar(data?: CampoStandard): void {
    this.standardsArray.push(
      this.fb.group({
        label: [data?.label ?? '', [Validators.required, Validators.minLength(1)]],
        description: [data?.description ?? ''],
        color: [data?.color ?? 'verde'],
        operator: [data?.operator ?? ''],
        value: [this.valorAControl(data?.value)],
        secondaryValue: [this.valorAControl(data?.secondaryValue)],
        unit: [data?.unit ?? ''],
      })
    );
  }

  eliminarEstandar(index: number): void {
    if (index < 0 || index >= this.standardsArray.length) {
      return;
    }
    this.standardsArray.removeAt(index);
  }

  private limpiarFormArray(array: FormArray): void {
    while (array.length) {
      array.removeAt(array.length - 1);
    }
  }

  private limpiarColeccionesCampo(): void {
    this.limpiarFormArray(this.presetOptionsArray);
    this.limpiarFormArray(this.standardsArray);
  }

  private normalizarColorCriticidad(color: string | null | undefined): CampoColor {
    const valor = `${color ?? ''}`.trim().toLowerCase();
    if (valor === 'rojo' || valor === 'verde' || valor === 'amarillo') {
      return valor as CampoColor;
    }
    return 'amarillo';
  }

  private valorAControl(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor.toString();
    }

    if (typeof valor === 'boolean') {
      return valor ? 'true' : 'false';
    }

    return `${valor}`.trim();
  }

  private normalizarValorComparacion(valor: any): string | number | boolean | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : null;
    }

    if (typeof valor === 'boolean') {
      return valor;
    }

    const texto = `${valor}`.trim();

    if (!texto.length) {
      return null;
    }

    const numero = Number(texto);
    return Number.isNaN(numero) ? texto : numero;
  }

  private obtenerOpcionesDesdeForm(): CampoPresetOption[] {
    return this.presetOptionsArray.controls
      .map((control) => {
        const label = `${control.get('label')?.value ?? ''}`.trim();
        const value = `${control.get('value')?.value ?? ''}`.trim();

        if (!label || !value) {
          return null;
        }

        const color = this.normalizarColorCriticidad(control.get('color')?.value);

        return {
          label,
          value,
          color,
        };
      })
      .filter((item): item is CampoPresetOption => item !== null);
  }

  private obtenerStandardsDesdeForm(): CampoStandard[] {
    return this.standardsArray.controls
      .map((control) => {
        const label = `${control.get('label')?.value ?? ''}`.trim();
        const description = `${control.get('description')?.value ?? ''}`.trim();

        if (!label && !description) {
          return null;
        }

        const color = this.normalizarColorCriticidad(control.get('color')?.value ?? 'amarillo');
        const operator = `${control.get('operator')?.value ?? ''}`.trim();
        const value = this.normalizarValorComparacion(control.get('value')?.value);
        const secondaryValue = this.normalizarValorComparacion(control.get('secondaryValue')?.value);
        const unit = `${control.get('unit')?.value ?? ''}`.trim();

        const standard: CampoStandard = {
          color,
          label: label || description,
        };

        if (description) {
          standard.description = description;
        }

        if (operator) {
          standard.operator = operator;
        }

        if (value !== null) {
          standard.value = value;
        }

        if (secondaryValue !== null) {
          standard.secondaryValue = secondaryValue;
        }

        if (unit) {
          standard.unit = unit;
        }

        return standard;
      })
      .filter((item): item is CampoStandard => item !== null);
  }

  private normalizarCampoMetadata(campo: Campo): Campo {
    return {
      ...campo,
      placeholder: campo.placeholder ?? null,
      presetOptions: Array.isArray(campo.presetOptions)
        ? campo.presetOptions
        : [],
      standards: Array.isArray(campo.standards) ? campo.standards : [],
    };
  }

  ngOnInit(): void {
    this.signalService.updateData('Tipos de equipos');
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.loaderService.showSection();
    forkJoin({
      tipos: this.apiService.typeEquipments().pipe(
        catchError((error) => {
          console.error('Error al cargar los tipos de equipos:', error);
          this.errorTipo =
            error?.error?.error ??
            'No se pudo cargar la informacion de tipos de equipos.';
          return of([] as TipoEquipo[]);
        })
      ),
      campos: this.apiService.getCamposCatalog().pipe(
        catchError((error) => {
          console.error('Error al cargar el catalogo de campos:', error);
          this.errorCampos =
            error?.error?.error ?? 'No se pudo cargar el catalogo de campos.';
          return of([] as Campo[]);
        })
      ),
      departamentos: this.apiService.getDepartamentosEquipo().pipe(
        catchError((error) => {
          console.error('Error al cargar los departamentos de equipo:', error);
          this.errorDepartamentos =
            error?.error?.error ??
            'No se pudo cargar la informacion de departamentos.';
          return of([] as DepartamentoEquipo[]);
        })
      ),
    })
      .pipe(finalize(() => this.loaderService.hideSection()))
      .subscribe({
        next: ({ tipos, campos, departamentos }) => {
          this.tipos = Array.isArray(tipos) ? tipos : [];
          this.campos = Array.isArray(campos)
            ? campos.map((campo) => this.normalizarCampoMetadata(campo))
            : [];
          this.departamentos = Array.isArray(departamentos)
            ? this.ordenarDepartamentos(departamentos)
            : [];
          const inicialesValidos = Array.from(this.camposInicialesSeleccionados).filter((id) =>
            this.campos.some((campo) => campo.id === id)
          );
          this.camposInicialesSeleccionados = new Set(inicialesValidos);
          this.crearTipoForm.get('campoIds')?.setValue(inicialesValidos);

          if (this.departamentoSeleccionado) {
            const existenteDepartamento = this.departamentos.find(
              (departamento) =>
                departamento.id === this.departamentoSeleccionado?.id
            );

            if (existenteDepartamento) {
              this.departamentoSeleccionado = existenteDepartamento;
              this.editarDepartamentoForm.patchValue({
                name: existenteDepartamento.name,
              });
            } else {
              this.departamentoSeleccionado = null;
              this.editarDepartamentoForm.reset({ name: '' });
            }
          }

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

  private ordenarDepartamentos(
    listado: DepartamentoEquipo[]
  ): DepartamentoEquipo[] {
    return [...listado].sort((a, b) => a.name.localeCompare(b.name));
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

  seleccionarDepartamento(departamento: DepartamentoEquipo): void {
    if (!departamento) {
      return;
    }

    this.departamentoSeleccionado = departamento;
    this.editarDepartamentoForm.reset({
      name: departamento.name,
    });
    this.mensajeDepartamento = '';
    this.errorDepartamento = '';
  }

  cancelarEdicionDepartamento(): void {
    this.departamentoSeleccionado = null;
    this.editarDepartamentoForm.reset({ name: '' });
    this.mensajeDepartamento = '';
    this.errorDepartamento = '';
  }

  crearDepartamento(): void {
    if (this.crearDepartamentoForm.invalid) {
      this.crearDepartamentoForm.markAllAsTouched();
      return;
    }

    const nombreCrudo = this.crearDepartamentoForm.get('name')?.value ?? '';
    const nombre = `${nombreCrudo}`.trim();

    if (!nombre) {
      this.errorDepartamento = 'El nombre del departamento es obligatorio.';
      return;
    }

    this.creandoDepartamento = true;
    this.mensajeDepartamento = '';
    this.errorDepartamento = '';
    this.mensajeDepartamentos = '';

    this.apiService
      .createDepartamentoEquipo({ name: nombre })
      .pipe(finalize(() => (this.creandoDepartamento = false)))
      .subscribe({
        next: (departamento) => {
          this.departamentos = this.ordenarDepartamentos([
            ...this.departamentos,
            departamento,
          ]);
          this.crearDepartamentoForm.reset({ name: '' });
          this.mensajeDepartamento = 'Departamento creado correctamente.';
        },
        error: (error) => {
          console.error('Error al crear departamento:', error);
          this.errorDepartamento =
            error?.error?.error ??
            'No se pudo crear el departamento. Intentalo nuevamente.';
        },
      });
  }

  actualizarDepartamento(): void {
    if (!this.departamentoSeleccionado) {
      return;
    }

    if (this.editarDepartamentoForm.invalid) {
      this.editarDepartamentoForm.markAllAsTouched();
      return;
    }

    const nombreCrudo = this.editarDepartamentoForm.get('name')?.value ?? '';
    const nombre = `${nombreCrudo}`.trim();

    if (!nombre) {
      this.errorDepartamento = 'El nombre del departamento es obligatorio.';
      return;
    }

    if (nombre === this.departamentoSeleccionado.name) {
      this.mensajeDepartamento = 'No hay cambios para actualizar.';
      return;
    }

    this.actualizandoDepartamento = true;
    this.mensajeDepartamento = '';
    this.errorDepartamento = '';

    this.apiService
      .updateDepartamentoEquipo(this.departamentoSeleccionado.id, { name: nombre })
      .pipe(finalize(() => (this.actualizandoDepartamento = false)))
      .subscribe({
        next: (actualizado) => {
          this.departamentos = this.ordenarDepartamentos(
            this.departamentos.map((item) =>
              item.id === actualizado.id ? actualizado : item
            )
          );
          this.departamentoSeleccionado = actualizado;
          this.editarDepartamentoForm.patchValue({ name: actualizado.name });
          this.mensajeDepartamento = 'Departamento actualizado correctamente.';
        },
        error: (error) => {
          console.error('Error al actualizar departamento:', error);
          this.errorDepartamento =
            error?.error?.error ??
            'No se pudo actualizar el departamento. Intentalo nuevamente.';
        },
      });
  }

  eliminarDepartamento(
    departamento: DepartamentoEquipo,
    event?: Event
  ): void {
    event?.stopPropagation();

    if (!departamento) {
      return;
    }

    const confirmar = window.confirm(
      `Deseas eliminar el departamento "${departamento.name}"?`
    );

    if (!confirmar) {
      return;
    }

    this.eliminandoDepartamento = true;
    this.mensajeDepartamentos = '';
    this.errorDepartamentos = '';

    this.apiService
      .deleteDepartamentoEquipo(departamento.id)
      .pipe(finalize(() => (this.eliminandoDepartamento = false)))
      .subscribe({
        next: () => {
          this.departamentos = this.departamentos.filter(
            (item) => item.id !== departamento.id
          );
          if (this.departamentoSeleccionado?.id === departamento.id) {
            this.cancelarEdicionDepartamento();
          }
          this.mensajeDepartamentos = 'Departamento eliminado correctamente.';
        },
        error: (error) => {
          console.error('Error al eliminar departamento:', error);
          const mensaje =
            error?.error?.error ??
            'No se pudo eliminar el departamento. Verifica que no tenga equipos asociados.';
          this.errorDepartamentos = mensaje;
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
    this.limpiarColeccionesCampo();
    (campo.presetOptions ?? []).forEach((opcion) =>
      this.agregarOpcionPreset(opcion)
    );
    (campo.standards ?? []).forEach((regla) =>
      this.agregarEstandar(regla)
    );
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
    this.limpiarColeccionesCampo();
    this.mensajeCampo = '';
    this.errorCampo = '';
  }

  enviarCampo(): void {
    if (this.campoForm.invalid) {
      this.campoForm.markAllAsTouched();
      return;
    }

    const { name, label, type, placeholder, required } = this.campoForm.value;
    const presetOptions = this.obtenerOpcionesDesdeForm();
    const standards = this.obtenerStandardsDesdeForm();
    const placeholderValue =
      typeof placeholder === 'string' ? placeholder.trim() : '';

    const payload = {
      name: name?.trim(),
      label: label?.trim(),
      type: type?.trim(),
      placeholder: placeholderValue || null,
      required: !!required,
      presetOptions,
      standards,
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
          const campoNormalizado = this.normalizarCampoMetadata(campo);
          if (this.campoEnEdicion) {
            this.campos = this.campos.map((item) =>
              item.id === campoNormalizado.id ? campoNormalizado : item
            );
            if (this.camposSeleccionados.has(campoNormalizado.id)) {
              this.camposDirty = true;
            }
            this.mensajeCampo = 'Campo actualizado correctamente.';
          } else {
            this.campos = [...this.campos, campoNormalizado];
            this.mensajeCampo = 'Campo creado correctamente.';
          }

          this.limpiarColeccionesCampo();
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
