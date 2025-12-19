import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { FormatInputRutDirective } from '../../../../directives/rut.directive';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { validarRut } from '../../../../validators/rut.validator';
import { Cliente } from '../../../../interfaces/cliente.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FEATURES } from '../../../../config/features';
import { ApiService } from '../../../../services/api.service';

type CampoBasico =
  | 'rut'
  | 'tipoDocumento'
  | 'razonSocial'
  | 'encargadoGeneral'
  | 'correo'
  | 'telefonoEncargado';
type CampoValidador =
  | CampoBasico
  | 'visitasMensuales'
  | 'visitasEmergenciaAnuales'
  | 'servicios';

@Component({
  selector: 'shared-crear-cliente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormatInputRutDirective,
    FormatInputTelefonoDirective,
  ],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearClienteComponent implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly features = FEATURES;

  ngOnInit(): void {
    const esLeadControl = this.clientForm.get('esLead');
    if (esLeadControl) {
      esLeadControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((valor) => {
          this.aplicarModoLead(!!valor);
        });
    }

    this.clientForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clientForm.markAsDirty();
      });

    this.aplicarModoLead(esLeadControl?.value ?? false);

    this.clientForm
      .get('tipoDocumento')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipo) => {
        this.actualizarValidadorRut(tipo);
        this.clientForm.get('rut')?.setValue(''); // Clear value on type change
      });
  }
  @Input() cliente: Cliente | null = null;
  @Input() modoEdicion: boolean = false;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public creating!: boolean;
  public selectedFile: File | null = null;
  public selectedLogoPerfil: File | null = null;
  private readonly initialFormValues = {
    esLead: false,
    tipoDocumento: 'Rut',
    rut: '',
    razonSocial: '',
    imagen: '',
    encargadoGeneral: '',
    correo: '',
    telefonoEncargado: '',
    visitasMensuales: 0,
    visitasEmergenciaAnuales: 0,
    servicios: [] as string[],
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    titular: '',
    rutTitular: '',
    correoNotificacion: '',
  };
  private readonly campoValidators: Record<CampoValidador, ValidatorFn[]> = {
    rut: [Validators.required, validarRut('Rut')],
    tipoDocumento: [Validators.required],
    razonSocial: [Validators.required],
    encargadoGeneral: [Validators.required],
    correo: [Validators.required, Validators.email],
    telefonoEncargado: [
      Validators.required,
      Validators.pattern('^[\\s\\S]{11,12}$'),
    ],
    visitasMensuales: FEATURES.visitasMensuales
      ? [Validators.required, Validators.min(0)]
      : [],
    visitasEmergenciaAnuales: FEATURES.visitasAnuales
      ? [Validators.required, Validators.min(0)]
      : [],
    servicios: FEATURES.servicios ? [Validators.required] : [],
  };
  public readonly tiposDocumento = ['Rut', 'Ruc', 'Dni'];
  public readonly serviciosDisponibles: string[] = [
    'Soporte TI',
    'Web',
    'Arriendo',
    'Camaras',
    'Redes Sociales',
    'Otros',
  ];

  isVisible: boolean = true;
  clientForm: FormGroup;
  errorMessage: string = '';
  tituloModal: string = 'Crear Cliente';

  // Tags
  tags: { id: number; nombre: string; color: string; editando?: boolean }[] =
    [];
  nuevoTagNombre: string = '';
  nuevoTagColor: string = '#6366f1';
  tagEditandoId: number | null = null;
  tagEditandoNombre: string = '';
  tagEditandoColor: string = '';
  guardandoTag: boolean = false;
  readonly coloresPredefinidos = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#6b7280',
  ];

  private leadValoresPrevios = {
    visitasMensuales: this.initialFormValues.visitasMensuales,
    visitasEmergenciaAnuales: this.initialFormValues.visitasEmergenciaAnuales,
    servicios: [...this.initialFormValues.servicios],
  };

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.clientForm = this.fb.group({
      esLead: [this.initialFormValues.esLead],
      tipoDocumento: [
        this.initialFormValues.tipoDocumento,
        this.campoValidators.tipoDocumento,
      ],
      rut: [this.initialFormValues.rut, this.campoValidators.rut],
      razonSocial: [
        this.initialFormValues.razonSocial,
        this.campoValidators.razonSocial,
      ],
      imagen: [this.initialFormValues.imagen],
      encargadoGeneral: [
        this.initialFormValues.encargadoGeneral,
        this.campoValidators.encargadoGeneral,
      ],
      correo: [this.initialFormValues.correo, this.campoValidators.correo],
      telefonoEncargado: [
        this.initialFormValues.telefonoEncargado,
        this.campoValidators.telefonoEncargado,
      ],
      visitasMensuales: [
        this.initialFormValues.visitasMensuales,
        this.campoValidators.visitasMensuales,
      ],
      visitasEmergenciaAnuales: [
        this.initialFormValues.visitasEmergenciaAnuales,
        this.campoValidators.visitasEmergenciaAnuales,
      ],
      servicios: [
        this.initialFormValues.servicios,
        this.campoValidators.servicios,
      ],
      banco: [this.initialFormValues.banco],
      tipoCuenta: [this.initialFormValues.tipoCuenta],
      numeroCuenta: [this.initialFormValues.numeroCuenta],
      titular: [this.initialFormValues.titular],
      rutTitular: [this.initialFormValues.rutTitular],
      correoNotificacion: [
        this.initialFormValues.correoNotificacion,
        Validators.email,
      ],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && changes['cliente'].currentValue) {
      this.cargarDatosCliente();
    }

    if (changes['modoEdicion']) {
      this.tituloModal = this.modoEdicion ? 'Editar Cliente' : 'Crear Cliente';

      // Si estamos en modo edición, la imagen no es obligatoria
      if (this.modoEdicion) {
        this.clientForm.get('imagen')?.clearValidators();
        this.clientForm.get('imagen')?.updateValueAndValidity();
      } else {
        this.clientForm.get('imagen')?.setValidators(Validators.required);
        this.clientForm.get('imagen')?.updateValueAndValidity();
      }
    }
  }

  cargarDatosCliente() {
    if (!this.cliente) {
      return;
    }

    const telefonoFormateado = this.formatearTelefonoParaEdicion(
      this.cliente.telefonoEncargado
    );
    const esLead = !!this.cliente.esLead;

    this.clientForm.patchValue(
      {
        esLead,
        rut: this.cliente.rut ?? '',
        razonSocial: this.cliente.razonSocial ?? '',
        encargadoGeneral: this.cliente.encargadoGeneral ?? '',
        correo: this.cliente.correo ?? '',
        telefonoEncargado: telefonoFormateado,
        visitasMensuales: this.cliente.visitasMensuales ?? 0,
        visitasEmergenciaAnuales: this.cliente.visitasEmergenciaAnuales ?? 0,
        servicios: this.cliente.servicios ?? [],
        banco: this.cliente.datosBancarios?.banco ?? '',
        tipoCuenta: this.cliente.datosBancarios?.tipoCuenta ?? '',
        numeroCuenta: this.cliente.datosBancarios?.numeroCuenta ?? '',
        titular: this.cliente.datosBancarios?.titular ?? '',
        rutTitular: this.cliente.datosBancarios?.rutTitular ?? '',
        correoNotificacion:
          this.cliente.datosBancarios?.correoNotificacion ?? '',
      },
      { emitEvent: false }
    );

    this.leadValoresPrevios = {
      visitasMensuales: this.cliente.visitasMensuales ?? 0,
      visitasEmergenciaAnuales: this.cliente.visitasEmergenciaAnuales ?? 0,
      servicios: Array.isArray(this.cliente.servicios)
        ? [...this.cliente.servicios]
        : [],
    };

    this.aplicarModoLead(esLead);
    this.clientForm.markAsPristine();

    // Cargar tags si estamos editando
    if (this.cliente?.id) {
      this.cargarTags(this.cliente.id);
    }
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.clientForm.reset(this.initialFormValues);
    this.leadValoresPrevios = {
      visitasMensuales: this.initialFormValues.visitasMensuales,
      visitasEmergenciaAnuales: this.initialFormValues.visitasEmergenciaAnuales,
      servicios: [...this.initialFormValues.servicios],
    };
    this.aplicarModoLead(this.initialFormValues.esLead);
    this.clientForm.markAsPristine();
    this.selectedFile = null;
    this.selectedLogoPerfil = null;
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input!.files![0];
    // Marcar el formulario como dirty si se selecciona una imagen
    this.clientForm.markAsDirty();
  }

  onLogoPerfilSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedLogoPerfil = input!.files![0];
    // Marcar el formulario como dirty si se selecciona un logo
    this.clientForm.markAsDirty();
  }

  onSubmit() {
    if (this.clientForm.valid) {
      this.creating = true;

      const formData = new FormData();
      const formValue = this.clientForm.getRawValue();
      const esLead = !!formValue['esLead'];
      const serviciosSeleccionados: string[] = Array.isArray(
        formValue['servicios']
      )
        ? [...formValue['servicios']]
        : [];

      // Limpiar el teléfono antes de enviarlo (solo números, 9 dígitos)
      let telefono = formValue['telefonoEncargado'] || '';
      telefono = telefono.replace(/\D/g, '').slice(0, 9);

      Object.keys(formValue).forEach((key) => {
        let value = formValue[key];
        if (key === 'servicios') {
          return;
        }
        if (key === 'esLead') {
          formData.append(key, value ? 'true' : 'false');
          return;
        }
        if (
          esLead &&
          (key === 'visitasMensuales' || key === 'visitasEmergenciaAnuales')
        ) {
          return;
        }
        if (key === 'telefonoEncargado') {
          value = telefono;
        }
        if (key === 'visitasMensuales' || key === 'visitasEmergenciaAnuales') {
          const parsedNumber = Number.parseInt(value, 10);
          const sanitizedNumber =
            Number.isNaN(parsedNumber) || parsedNumber < 0 ? 0 : parsedNumber;
          formData.append(key, sanitizedNumber.toString());
          return;
        }
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

      if (!esLead) {
        formData.append('servicios', JSON.stringify(serviciosSeleccionados));
      }

      const datosBancarios = this.obtenerDatosBancariosFormulario();
      formData.append('datosBancarios', JSON.stringify(datosBancarios));

      // Manejar el archivo de imagen
      if (this.selectedFile) {
        formData.set('imagen', this.selectedFile);
      }

      // Si estamos en modo edición y no se seleccionó una nueva imagen,
      // no enviamos el campo imagen para mantener la imagen actual
      if (this.modoEdicion && !this.selectedFile) {
        formData.delete('imagen');
      }

      // Manejar el archivo de logo de perfil
      if (this.selectedLogoPerfil) {
        formData.set('logoPerfil', this.selectedLogoPerfil);
      }

      // Imprimir los datos que se van a enviar para depuración
      console.log('Datos del formulario a enviar:');
      Object.keys(formValue).forEach((field) => {
        console.log(`${field}: ${formData.get(field)}`);
      });

      this.enviarFormulario.emit(formData);
    } else {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';

      // Marcar todos los campos como touched para mostrar los errores
      Object.keys(this.clientForm.controls).forEach((key) => {
        this.clientForm.get(key)?.markAsTouched();
      });
    }
  }

  private aplicarModoLead(esLead: boolean): void {
    this.actualizarValidadoresLead(esLead);
    this.toggleCamposLead(esLead);
  }

  private actualizarValidadoresLead(esLead: boolean): void {
    const camposBasicos: CampoBasico[] = [
      'rut',
      'tipoDocumento',
      'razonSocial',
      'encargadoGeneral',
      'correo',
      'telefonoEncargado',
    ];
    camposBasicos.forEach((campo) => {
      const control = this.clientForm.get(campo);
      if (!control) {
        return;
      }
      if (esLead) {
        control.clearValidators();
      } else {
        if (campo === 'rut') {
          const tipo = this.clientForm.get('tipoDocumento')?.value;
          control.setValidators([Validators.required, validarRut(tipo)]);
        } else {
          control.setValidators(this.campoValidators[campo]);
        }
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    const visitasMensualesCtrl = this.clientForm.get('visitasMensuales');
    const visitasEmergenciaCtrl = this.clientForm.get(
      'visitasEmergenciaAnuales'
    );
    const serviciosCtrl = this.clientForm.get('servicios');

    if (esLead) {
      visitasMensualesCtrl?.clearValidators();
      visitasEmergenciaCtrl?.clearValidators();
      serviciosCtrl?.clearValidators();
    } else {
      visitasMensualesCtrl?.setValidators(
        this.campoValidators.visitasMensuales
      );
      visitasEmergenciaCtrl?.setValidators(
        this.campoValidators.visitasEmergenciaAnuales
      );
      serviciosCtrl?.setValidators(this.campoValidators.servicios);
    }

    visitasMensualesCtrl?.updateValueAndValidity({ emitEvent: false });
    visitasEmergenciaCtrl?.updateValueAndValidity({ emitEvent: false });
    serviciosCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private actualizarValidadorRut(tipo: 'Rut' | 'Ruc' | 'Dni'): void {
    const rutControl = this.clientForm.get('rut');
    if (rutControl) {
      rutControl.setValidators([Validators.required, validarRut(tipo)]);
      rutControl.updateValueAndValidity();
    }
  }

  private toggleCamposLead(esLead: boolean): void {
    const visitasMensualesCtrl = this.clientForm.get('visitasMensuales');
    const visitasEmergenciaCtrl = this.clientForm.get(
      'visitasEmergenciaAnuales'
    );
    const serviciosCtrl = this.clientForm.get('servicios');

    if (esLead) {
      const serviciosActuales = serviciosCtrl?.value;
      this.leadValoresPrevios = {
        visitasMensuales: visitasMensualesCtrl?.value ?? 0,
        visitasEmergenciaAnuales: visitasEmergenciaCtrl?.value ?? 0,
        servicios: Array.isArray(serviciosActuales)
          ? [...serviciosActuales]
          : [],
      };

      visitasMensualesCtrl?.setValue(0, { emitEvent: false });
      visitasMensualesCtrl?.disable({ emitEvent: false });
      visitasEmergenciaCtrl?.setValue(0, { emitEvent: false });
      visitasEmergenciaCtrl?.disable({ emitEvent: false });
      serviciosCtrl?.setValue([], { emitEvent: false });
      serviciosCtrl?.disable({ emitEvent: false });
    } else {
      visitasMensualesCtrl?.enable({ emitEvent: false });
      visitasMensualesCtrl?.setValue(
        this.leadValoresPrevios.visitasMensuales ?? 0,
        { emitEvent: false }
      );
      visitasEmergenciaCtrl?.enable({ emitEvent: false });
      visitasEmergenciaCtrl?.setValue(
        this.leadValoresPrevios.visitasEmergenciaAnuales ?? 0,
        { emitEvent: false }
      );
      serviciosCtrl?.enable({ emitEvent: false });
      serviciosCtrl?.setValue([...this.leadValoresPrevios.servicios], {
        emitEvent: false,
      });
    }
  }

  private formatearTelefonoParaEdicion(
    telefono: string | number | null | undefined
  ): string {
    const soloDigitos = String(telefono ?? '')
      .replace(/\D/g, '')
      .slice(0, 9);
    if (soloDigitos.length <= 1) {
      return soloDigitos;
    }
    if (soloDigitos.length <= 5) {
      return `${soloDigitos.slice(0, 1)} ${soloDigitos.slice(1)}`;
    }
    return `${soloDigitos.slice(0, 1)} ${soloDigitos.slice(
      1,
      5
    )} ${soloDigitos.slice(5)}`;
  }

  toggleServicio(servicio: string): void {
    const control = this.clientForm.get('servicios');
    if (!control || control.disabled) {
      return;
    }
    const seleccionados = Array.isArray(control.value)
      ? [...control.value]
      : [];
    const index = seleccionados.indexOf(servicio);
    if (index >= 0) {
      seleccionados.splice(index, 1);
    } else {
      seleccionados.push(servicio);
    }
    control.setValue(seleccionados);
    control.markAsDirty();
    control.markAsTouched();
  }

  estaServicioSeleccionado(servicio: string): boolean {
    const control = this.clientForm.get('servicios');
    const seleccionados = Array.isArray(control?.value) ? control?.value : [];
    return seleccionados.includes(servicio);
  }

  private obtenerDatosBancariosFormulario() {
    const limpiar = (valor: unknown): string | null => {
      if (valor === null || valor === undefined) {
        return null;
      }
      const texto = typeof valor === 'string' ? valor : `${valor}`;
      const trimmed = texto.trim();
      return trimmed.length ? trimmed : null;
    };

    const valores = this.clientForm.getRawValue();
    return {
      banco: limpiar(valores['banco']),
      tipoCuenta: limpiar(valores['tipoCuenta']),
      numeroCuenta: limpiar(valores['numeroCuenta']),
      titular: limpiar(valores['titular']),
      rutTitular: limpiar(valores['rutTitular']),
      correoNotificacion: limpiar(valores['correoNotificacion']),
    };
  }

  // ===============================================
  // Métodos de Tags
  // ===============================================

  private cargarTags(clienteId: string): void {
    this.apiService.getTagsCliente(clienteId).subscribe({
      next: (tags) => {
        this.tags = Array.isArray(tags)
          ? tags.map((t) => ({ ...t, editando: false }))
          : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.tags = [];
        this.cdr.markForCheck();
      },
    });
  }

  agregarTag(): void {
    if (!this.nuevoTagNombre.trim() || !this.cliente?.id || this.guardandoTag) {
      return;
    }
    this.guardandoTag = true;
    this.apiService
      .crearTag(this.cliente.id, {
        nombre: this.nuevoTagNombre.trim(),
        color: this.nuevoTagColor,
      })
      .subscribe({
        next: (nuevoTag) => {
          this.tags.push({ ...nuevoTag, editando: false });
          this.nuevoTagNombre = '';
          this.nuevoTagColor = '#6366f1';
          this.guardandoTag = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardandoTag = false;
          this.cdr.markForCheck();
        },
      });
  }

  iniciarEdicionTag(tag: { id: number; nombre: string; color: string }): void {
    this.tagEditandoId = tag.id;
    this.tagEditandoNombre = tag.nombre;
    this.tagEditandoColor = tag.color;
  }

  guardarEdicionTag(): void {
    if (
      !this.tagEditandoNombre.trim() ||
      !this.cliente?.id ||
      !this.tagEditandoId ||
      this.guardandoTag
    ) {
      return;
    }
    this.guardandoTag = true;
    this.apiService
      .actualizarTag(this.cliente.id, this.tagEditandoId, {
        nombre: this.tagEditandoNombre.trim(),
        color: this.tagEditandoColor,
      })
      .subscribe({
        next: (tagActualizado) => {
          const index = this.tags.findIndex((t) => t.id === this.tagEditandoId);
          if (index >= 0) {
            this.tags[index] = { ...tagActualizado, editando: false };
          }
          this.cancelarEdicionTag();
          this.guardandoTag = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardandoTag = false;
          this.cdr.markForCheck();
        },
      });
  }

  cancelarEdicionTag(): void {
    this.tagEditandoId = null;
    this.tagEditandoNombre = '';
    this.tagEditandoColor = '';
  }

  eliminarTag(tag: { id: number; nombre: string }): void {
    if (!this.cliente?.id || this.guardandoTag) {
      return;
    }
    if (!confirm(`¿Eliminar el tag "${tag.nombre}"?`)) {
      return;
    }
    this.guardandoTag = true;
    this.apiService.eliminarTag(this.cliente.id, tag.id).subscribe({
      next: () => {
        this.tags = this.tags.filter((t) => t.id !== tag.id);
        this.guardandoTag = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardandoTag = false;
        this.cdr.markForCheck();
      },
    });
  }

  seleccionarColorNuevoTag(color: string): void {
    this.nuevoTagColor = color;
  }

  seleccionarColorEdicion(color: string): void {
    this.tagEditandoColor = color;
  }
}
