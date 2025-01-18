import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';

@Component({
  selector: 'shared-eliminar-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eliminar-usuario.component.html',
  styleUrl: './eliminar-usuario.component.css'
})
export class EliminarUsuarioComponent {
  // ID del usuario
  @Input() idUsuario?: number;
  @Input() usuario?: Cuenta;

  public isVisible: boolean = true;
  public errorMessage: string = '';

  // Control del modal
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();
  @Output() abrirModificar = new EventEmitter<any>();

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.idUsuario) {
      console.log(this.idUsuario);
      this.enviarFormulario.emit(this.idUsuario);
      this.cerrar();
    }
  }

  abrirModModal() {
    this.abrirModificar.emit(true);
    this.cerrar();
  }
}
