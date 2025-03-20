import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Equipo } from '../../../../interfaces/equipo.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SignedUrlPipe } from '../../../../pipes/generar-url.pipe';

@Component({
  selector: 'shared-ver-informacion',
  standalone: true,
  imports: [CommonModule, SignedUrlPipe],
  templateUrl: './ver-informacion.component.html',
  styleUrl: './ver-informacion.component.css'
})
export class VerInformacionComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public observacionesForm: FormGroup;

  @Input() Equipo!: Equipo;
  @Input() idEquipo!: number;

  public isVisible: boolean = true;
  public errorMessage: string = '';

  constructor(private fb: FormBuilder) {
    this.observacionesForm = this.fb.group({
      comentario: ['', Validators.required],
    });
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.observacionesForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.observacionesForm.valid) {

      this.enviarFormulario.emit(this.observacionesForm.value);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
