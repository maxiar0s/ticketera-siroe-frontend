import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { FormatInputRutDirective } from '../../../../directives/rut.directive';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { validarRut } from '../../../../validators/rut.validator';
import { Cliente } from '../../../../interfaces/cliente.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type CampoBasico = 'rut' | 'razonSocial' | 'encargadoGeneral' | 'correo' | 'telefonoEncargado';
type CampoValidador = CampoBasico | 'visitasMensuales' | 'visitasEmergenciaAnuales' | 'servicios';

@Component({
  selector: 'shared-crear-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputRutDirective, FormatInputTelefonoDirective],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearClienteComponent implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);

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
  }
  @Input() cliente: Cliente | null = null;
  @Input() modoEdicion: boolean = false;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public creating!: boolean;
  public selectedFile: File | null = null;
  private readonly initialFormValues = {
    esLead: false,
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
    rut: [Validators.required, validarRut()],
    razonSocial: [Validators.required],
    encargadoGeneral: [Validators.required],
    correo: [Validators.required, Validators.email],
    telefonoEncargado: [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')],
    visitasMensuales: [Validators.required, Validators.min(0)],
    visitasEmergenciaAnuales: [Validators.required, Validators.min(0)],
    servicios: [Validators.required],
  };
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
  private leadValoresPrevios = {
    visitasMensuales: this.initialFormValues.visitasMensuales,
    visitasEmergenciaAnuales: this.initialFormValues.visitasEmergenciaAnuales,
    servicios: [...this.initialFormValues.servicios],
  };

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      esLead: [this.initialFormValues.esLead],
      rut: [this.initialFormValues.rut, this.campoValidators.rut],
      razonSocial: [this.initialFormValues.razonSocial, this.campoValidators.razonSocial],
      imagen: [this.initialFormValues.imagen],
      encargadoGeneral: [this.initialFormValues.encargadoGeneral, this.campoValidators.encargadoGeneral],
      correo: [this.initialFormValues.correo, this.campoValidators.correo],
      telefonoEncargado: [this.initialFormValues.telefonoEncargado, this.campoValidators.telefonoEncargado],
      visitasMensuales: [this.initialFormValues.visitasMensuales, this.campoValidators.visitasMensuales],
      visitasEmergenciaAnuales: [this.initialFormValues.visitasEmergenciaAnuales, this.campoValidators.visitasEmergenciaAnuales],
      servicios: [this.initialFormValues.servicios, this.campoValidators.servicios],
      banco: [this.initialFormValues.banco],
      tipoCuenta: [this.initialFormValues.tipoCuenta],
      numeroCuenta: [this.initialFormValues.numeroCuenta],
      titular: [this.initialFormValues.titular],
      rutTitular: [this.initialFormValues.rutTitular],
      correoNotificacion: [this.initialFormValues.correoNotificacion, Validators.email],
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

    const telefonoFormateado = this.formatearTelefonoParaEdicion(this.cliente.telefonoEncargado);
    const esLead = !!this.cliente.esLead;

    this.clientForm.patchValue({
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
      correoNotificacion: this.cliente.datosBancarios?.correoNotificacion ?? '',
    }, { emitEvent: false });

    this.leadValoresPrevios = {
      visitasMensuales: this.cliente.visitasMensuales ?? 0,
      visitasEmergenciaAnuales: this.cliente.visitasEmergenciaAnuales ?? 0,
      servicios: Array.isArray(this.cliente.servicios) ? [...this.cliente.servicios] : [],
    };

    this.aplicarModoLead(esLead);
    this.clientForm.markAsPristine();
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
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input!.files![0];
    // Marcar el formulario como dirty si se selecciona una imagen
    this.clientForm.markAsDirty();
  }

  onSubmit() {
    if (this.clientForm.valid) {
      this.creating = true;

      const formData = new FormData();
      const formValue = this.clientForm.getRawValue();
      const esLead = !!formValue['esLead'];
      const serviciosSeleccionados: string[] = Array.isArray(formValue['servicios'])
        ? [...formValue['servicios']]
        : [];

      // Limpiar el teléfono antes de enviarlo (solo números, 9 dígitos)
      let telefono = formValue['telefonoEncargado'] || '';
      telefono = telefono.replace(/\D/g, '').slice(0, 9);

      Object.keys(formValue).forEach(key => {
        let value = formValue[key];
        if (key === 'servicios') {
          return;
        }
        if (key === 'esLead') {
          formData.append(key, value ? 'true' : 'false');
          return;
        }
        if (esLead && (key === 'visitasMensuales' || key === 'visitasEmergenciaAnuales')) {
          return;
        }
        if (key === 'telefonoEncargado') {
          value = telefono;
        }
        if (key === 'visitasMensuales' || key === 'visitasEmergenciaAnuales') {
          const parsedNumber = Number.parseInt(value, 10);
          const sanitizedNumber = Number.isNaN(parsedNumber) || parsedNumber < 0 ? 0 : parsedNumber;
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

      // Imprimir los datos que se van a enviar para depuración
      console.log('Datos del formulario a enviar:');
      Object.keys(formValue).forEach(field => {
        console.log(`${field}: ${formData.get(field)}`);
      });

      this.enviarFormulario.emit(formData);
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';

      // Marcar todos los campos como touched para mostrar los errores
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
    }
  }

  private aplicarModoLead(esLead: boolean): void {
    this.actualizarValidadoresLead(esLead);
    this.toggleCamposLead(esLead);
  }

  private actualizarValidadoresLead(esLead: boolean): void {
    const camposBasicos: CampoBasico[] = ['rut', 'razonSocial', 'encargadoGeneral', 'correo', 'telefonoEncargado'];
    camposBasicos.forEach((campo) => {
      const control = this.clientForm.get(campo);
      if (!control) {
        return;
      }
      if (esLead) {
        control.clearValidators();
      } else {
        control.setValidators(this.campoValidators[campo]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    const visitasMensualesCtrl = this.clientForm.get('visitasMensuales');
    const visitasEmergenciaCtrl = this.clientForm.get('visitasEmergenciaAnuales');
    const serviciosCtrl = this.clientForm.get('servicios');

    if (esLead) {
      visitasMensualesCtrl?.clearValidators();
      visitasEmergenciaCtrl?.clearValidators();
      serviciosCtrl?.clearValidators();
    } else {
      visitasMensualesCtrl?.setValidators(this.campoValidators.visitasMensuales);
      visitasEmergenciaCtrl?.setValidators(this.campoValidators.visitasEmergenciaAnuales);
      serviciosCtrl?.setValidators(this.campoValidators.servicios);
    }

    visitasMensualesCtrl?.updateValueAndValidity({ emitEvent: false });
    visitasEmergenciaCtrl?.updateValueAndValidity({ emitEvent: false });
    serviciosCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private toggleCamposLead(esLead: boolean): void {
    const visitasMensualesCtrl = this.clientForm.get('visitasMensuales');
    const visitasEmergenciaCtrl = this.clientForm.get('visitasEmergenciaAnuales');
    const serviciosCtrl = this.clientForm.get('servicios');

    if (esLead) {
      const serviciosActuales = serviciosCtrl?.value;
      this.leadValoresPrevios = {
        visitasMensuales: visitasMensualesCtrl?.value ?? 0,
        visitasEmergenciaAnuales: visitasEmergenciaCtrl?.value ?? 0,
        servicios: Array.isArray(serviciosActuales) ? [...serviciosActuales] : [],
      };

      visitasMensualesCtrl?.setValue(0, { emitEvent: false });
      visitasMensualesCtrl?.disable({ emitEvent: false });
      visitasEmergenciaCtrl?.setValue(0, { emitEvent: false });
      visitasEmergenciaCtrl?.disable({ emitEvent: false });
      serviciosCtrl?.setValue([], { emitEvent: false });
      serviciosCtrl?.disable({ emitEvent: false });
    } else {
      visitasMensualesCtrl?.enable({ emitEvent: false });
      visitasMensualesCtrl?.setValue(this.leadValoresPrevios.visitasMensuales ?? 0, { emitEvent: false });
      visitasEmergenciaCtrl?.enable({ emitEvent: false });
      visitasEmergenciaCtrl?.setValue(this.leadValoresPrevios.visitasEmergenciaAnuales ?? 0, { emitEvent: false });
      serviciosCtrl?.enable({ emitEvent: false });
      serviciosCtrl?.setValue([...this.leadValoresPrevios.servicios], { emitEvent: false });
    }
  }

  private formatearTelefonoParaEdicion(telefono: string | number | null | undefined): string {
    const soloDigitos = String(telefono ?? '').replace(/\D/g, '').slice(0, 9);
    if (soloDigitos.length <= 1) {
      return soloDigitos;
    }
    if (soloDigitos.length <= 5) {
      return `${soloDigitos.slice(0, 1)} ${soloDigitos.slice(1)}`;
    }
    return `${soloDigitos.slice(0, 1)} ${soloDigitos.slice(1, 5)} ${soloDigitos.slice(5)}`;
  }

  toggleServicio(servicio: string): void {
    const control = this.clientForm.get('servicios');
    if (!control || control.disabled) {
      return;
    }
    const seleccionados = Array.isArray(control.value) ? [...control.value] : [];
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
}
