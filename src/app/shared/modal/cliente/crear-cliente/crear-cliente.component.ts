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
  private formData = new FormData();

  isVisible: boolean = true;
  clientForm: FormGroup;
  errorMessage: string = '';
  tituloModal: string = 'Crear Cliente';

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      rut: ['', [Validators.required, validarRut()]],
      razonSocial: ['', Validators.required],
      imagen: [''],
      encargadoGeneral: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefonoEncargado: ['', [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')]]
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
      this.clientForm.patchValue({
        rut: this.cliente.rut,
        razonSocial: this.cliente.razonSocial,
        encargadoGeneral: this.cliente.encargadoGeneral,
        correo: this.cliente.correo,
        telefonoEncargado: this.cliente.telefonoEncargado
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
    this.clientForm.reset();
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

      // Limpiar el teléfono antes de enviarlo (solo números, 9 dígitos)
      let telefono = this.clientForm.value['telefonoEncargado'] || '';
      telefono = telefono.replace(/\D/g, '').slice(0, 9);

      // Agregar todos los campos del formulario al FormData
      Object.keys(this.clientForm.value).forEach(key => {
        let value = this.clientForm.value[key];
        if (key === 'telefonoEncargado') {
          value = telefono;
        }
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

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
}
