import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormatInputRutDirective } from '../../../../directives/rut.directive';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { validarRut } from '../../../../validators/rut.validator';

@Component({
  selector: 'shared-crear-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputRutDirective, FormatInputTelefonoDirective],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css'
})
export class CrearClienteComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public selectedFile: File | null = null;
  private formData = new FormData();

  isVisible: boolean = true;
  clientForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      rut: ['', [Validators.required, validarRut()]],
      razonSocial: ['', Validators.required],
      imagen: ['', Validators.required],
      encargadoGeneral: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefonoEncargado: ['', [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')]]
    });
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
  }

  onSubmit() {
    if (this.clientForm.valid) {

      Object.keys(this.clientForm.value).forEach(key => {
        this.formData.append(key, this.clientForm.value[key]);
      });
      if(this.selectedFile) this.formData.set('imagen', this.selectedFile);

      this.enviarFormulario.emit(this.formData);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
