import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { BehaviorSubject, debounceTime, switchMap } from 'rxjs';
import { correoConArrobaYpunto } from '../../../../validators/correoValido.validator';
import { FormatInputSoloNumerosDirective } from '../../../../directives/solo-numeros.directive';

@Component({
  selector: 'shared-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputSoloNumerosDirective],
  templateUrl: './crear-usuario.component.html',
  styleUrl: './crear-usuario.component.css'
})
export class CrearUsuarioComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public formError: boolean = true;
  public correoExistente$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public cuentaForm:        FormGroup;

  public isVisible:         boolean = true;
  public errorMessage:      string = '';
  public id:                string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
  ) {
    this.cuentaForm = this.fb.group({
      name: ['', Validators.required],
      tipoCuentaId: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, correoConArrobaYpunto()]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.formError = true;
    this.cuentaForm.get('email')!.valueChanges.pipe(
      debounceTime(600),
      switchMap(email => {
        return this.apiService.verificarCorreoExistente(email).pipe(
        );
      })
    ).subscribe(isTaken => {
      this.correoExistente$.next(isTaken);
      if(isTaken) {
        this.formError = true;
      } else this.formError = false;
    });
  }

  verificarFormulario():boolean {
    return this.cuentaForm.invalid || this.correoExistente$.getValue() || this.formError;
  }

  validacionCampoCorreo(event: Event): void {
    this.formError = true;
    this.correoExistente$.next(false);
    const input = event.target as HTMLInputElement;
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.cuentaForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.cuentaForm.valid) {
      this.enviarFormulario.emit(this.cuentaForm.value);
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  changeSelectColor(event: Event) {
    const Element = event.currentTarget as HTMLAnchorElement;

    Element.classList.add('colorSelect')
  }
}
