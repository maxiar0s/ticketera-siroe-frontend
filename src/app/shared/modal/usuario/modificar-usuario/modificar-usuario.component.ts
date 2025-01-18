import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';
import { LoaderService } from '../../../../services/loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shared-modificar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modificar-usuario.component.html',
  styleUrl: './modificar-usuario.component.css'
})
export class ModificarUsuarioComponent {
  // Form usuario
  public usuarioForm: FormGroup;

  // ID del usuario
  @Input() usuario?: Cuenta;

  public isVisible: boolean = true;
  public errorMessage: string = '';

  // Control del modal
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    public loaderService: LoaderService
  ) {
    this.usuarioForm = this.fb.group({
        id: ['', Validators.required],
        name: ['', Validators.required],
        tipoCuentaId: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
        password: [''],
        estadoCuentaId: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.usuarioForm.patchValue({
      id: this.usuario ? this.usuario.id : '',
      name: this.usuario ? this.usuario.name : '',
      tipoCuentaId: this.usuario ? this.usuario.tipoCuentaId : '',
      telefono: this.usuario ? this.usuario.telefono : '',
      estadoCuentaId: this.usuario ? this.usuario.estadoCuentaId : '',
    });
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.usuarioForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.usuarioForm.valid) {
      this.enviarFormulario.emit(this.usuarioForm.value);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  soloNumeros(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
  }
}
