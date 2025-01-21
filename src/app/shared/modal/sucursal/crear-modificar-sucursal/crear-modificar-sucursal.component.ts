import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormatInputTelefonoDirective } from '../../../../directives/telefono.directive';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';

@Component({
  selector: 'shared-crear-modificar-sucursal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputTelefonoDirective],
  templateUrl: './crear-modificar-sucursal.component.html',
  styleUrl: './crear-modificar-sucursal.component.css'
})
export class CrearModificarSucursalComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  @Input() casaMatrizId!: string;
  @Input() idSucursal?: string;
  @Input() sucursal?: Sucursal;
  public creating!: boolean;

  public boton_texto!: string;
  public isVisible: boolean = true;
  public sucursalForm: FormGroup;
  public errorMessage: string = '';

  constructor(private fb: FormBuilder) {
    this.sucursalForm = this.fb.group({
      sucursal: ['', Validators.required],
      direccion: ['', Validators.required],
      encargadoSucursal: ['', Validators.required],
      correoSucursal: ['', [Validators.required, Validators.email]],
      telefonoSucursal: ['', [Validators.required, Validators.pattern('^[\\s\\S]{11,12}$')]]
    });
  }

  ngOnInit() {
    if(this.idSucursal && this.sucursal) {
      this.boton_texto = 'Modificar sucursal';
      this.sucursalForm.addControl('sucursalId', new FormControl('', [Validators.required]));

      this.sucursalForm.patchValue({
        sucursalId: this.sucursal.id,
        sucursal: this.sucursal.sucursal,
        direccion: this.sucursal.direccion,
        encargadoSucursal: this.sucursal.encargadoSucursal,
        correoSucursal: this.sucursal.correoSucursal,
        telefonoSucursal: this.sucursal.telefonoSucursal
      });
    } else {
      this.boton_texto = 'Añadir sucursal';
      this.sucursalForm.addControl('casaMatrizId', new FormControl('', [Validators.required]));

      this.sucursalForm.patchValue({
        casaMatrizId: this.casaMatrizId
      });
    }
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.sucursalForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.sucursalForm.valid) {
      this.creating = true;

      this.enviarFormulario.emit(this.sucursalForm.value);
      // this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
