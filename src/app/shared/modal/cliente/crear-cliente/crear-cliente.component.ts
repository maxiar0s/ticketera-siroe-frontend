import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormatInputRutDirective } from '../../../../directives/rut.directive';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { validarRut } from '../../../../validators/rut.validator';
import { Cliente } from '../../../../interfaces/cliente.interface';

@Component({
  selector: 'shared-crear-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputRutDirective, FormatInputTelefonoDirective],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css'
})
export class CrearClienteComponent implements OnChanges {
  ngOnInit(): void {
    // Marcar el formulario como dirty si cualquier campo cambia
    Object.keys(this.clientForm.controls).forEach(key => {
      this.clientForm.get(key)?.valueChanges.subscribe(() => {
        this.clientForm.markAsDirty();
      });
    });
  }
  @Input() cliente: Cliente | null = null;
  @Input() modoEdicion: boolean = false;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public creating!: boolean;
  public selectedFile: File | null = null;
  private readonly initialFormValues = {
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

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      rut: [this.initialFormValues.rut, [Validators.required, validarRut()]],
      razonSocial: [this.initialFormValues.razonSocial, Validators.required],
      imagen: [this.initialFormValues.imagen],
      encargadoGeneral: [this.initialFormValues.encargadoGeneral, Validators.required],
      correo: [this.initialFormValues.correo, [Validators.required, Validators.email]],
      telefonoEncargado: [this.initialFormValues.telefonoEncargado, [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')]],
      visitasMensuales: [this.initialFormValues.visitasMensuales, [Validators.required, Validators.min(0)]],
      visitasEmergenciaAnuales: [this.initialFormValues.visitasEmergenciaAnuales, [Validators.required, Validators.min(0)]],
      servicios: [this.initialFormValues.servicios, [Validators.required]],
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
    if (this.cliente) {
      const telefonoFormateado = this.formatearTelefonoParaEdicion(this.cliente.telefonoEncargado);
      this.clientForm.patchValue({
        rut: this.cliente.rut,
        razonSocial: this.cliente.razonSocial,
        encargadoGeneral: this.cliente.encargadoGeneral,
        correo: this.cliente.correo,
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
      });
      // Resetear el estado dirty al cargar datos
      this.clientForm.markAsPristine();
    }
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.clientForm.reset(this.initialFormValues);
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

      // Crear un nuevo FormData para evitar duplicados
      const formData = new FormData();
      const serviciosSeleccionados: string[] = Array.isArray(this.clientForm.value['servicios'])
        ? [...this.clientForm.value['servicios']]
        : [];

      // Limpiar el teléfono antes de enviarlo (solo números, 9 dígitos)
      let telefono = this.clientForm.value['telefonoEncargado'] || '';
      telefono = telefono.replace(/\D/g, '').slice(0, 9);

      // Agregar todos los campos del formulario al FormData
      Object.keys(this.clientForm.value).forEach(key => {
        let value = this.clientForm.value[key];
        if (key === 'servicios') {
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

      formData.append('servicios', JSON.stringify(serviciosSeleccionados));

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
      Object.keys(this.clientForm.value).forEach(field => {
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
    if (!control) {
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
