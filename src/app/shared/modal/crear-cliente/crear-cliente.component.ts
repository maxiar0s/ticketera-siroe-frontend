import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'shared-crear-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.css'
})
export class CrearClienteComponent {

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  isVisible: boolean = true;
  clientForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      rut: ['', [Validators.required, Validators.pattern(/^\d{7,8}-[kK\d]$/)]],
      razonSocial: ['', Validators.required],
      encargadoGeneral: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefonoEncargado: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]]
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

  onSubmit() {
    if (this.clientForm.valid) {
      this.enviarFormulario.emit(this.clientForm.value);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
