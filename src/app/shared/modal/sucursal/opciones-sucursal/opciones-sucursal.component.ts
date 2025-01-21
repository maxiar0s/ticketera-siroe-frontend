import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shared-opciones-sucursal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opciones-sucursal.component.html',
  styleUrl: './opciones-sucursal.component.css'
})
export class OpcionesSucursalComponent {
  // ID del usuario
    @Input() idSucursal?: string;
    @Input() sucursal?: Sucursal;

    public isVisible: boolean = true;
    public errorMessage: string = '';
    public deleting!: boolean;

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
      if (this.idSucursal) {
        this.deleting = true;
        this.enviarFormulario.emit(this.idSucursal);
        // this.cerrar();
      }
    }

    abrirModModal() {
      this.abrirModificar.emit(true);
      this.cerrar();
    }
}
