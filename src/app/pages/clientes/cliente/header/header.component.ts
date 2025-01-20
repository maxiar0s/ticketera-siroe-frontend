import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrearModificarSucursalComponent } from '../../../../shared/modal/sucursal/crear-modificar-sucursal/crear-modificar-sucursal.component';

@Component({
  selector: 'cliente-header',
  standalone: true,
  imports: [CommonModule, CrearModificarSucursalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() esAdministrador!: boolean;
  @Input() casaMatrizId!: string;
  @Output() enviarFormulario = new EventEmitter<void>();

  // Control modal
  public isModalVisible:    boolean = false;
  public successMessage:    string = '';
  public errorMessage:      string = '';

  public filterForm: FormGroup = this.fb.group({
    fecha: ['', [Validators.required]],
    ubicacion: ['', [Validators.required]],
  })

  constructor(
    public fb: FormBuilder
  ) {}

  crearSucursal(datos: any) {
    this.enviarFormulario.emit(datos);
  }

  abrirModal() {
    // event.preventDefault();
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
