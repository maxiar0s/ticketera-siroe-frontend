import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { BehaviorSubject, debounceTime, switchMap } from 'rxjs';
import { correoConArrobaYpunto } from '../../../../validators/correoValido.validator';
import { ClienteResumen } from '../../../../interfaces/cliente-resumen.interface';
import { FormatInputSoloNumerosDirective } from '../../../../directives/solo-numeros.directive';

@Component({
  selector: 'shared-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputSoloNumerosDirective],
  templateUrl: './crear-usuario.component.html',
  styleUrl: './crear-usuario.component.css',
})
export class CrearUsuarioComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public formError: boolean = true;
  public correoExistente$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public cuentaForm: FormGroup;

  public isVisible: boolean = true;
  public errorMessage: string = '';

  public clientesDisponibles: ClienteResumen[] = [];
  public clientesSeleccionados: ClienteResumen[] = [];
  public clientesDropdownAbierto: boolean = false;

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.cuentaForm = this.fb.group({
      name: ['', Validators.required],
      tipoCuentaId: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, correoConArrobaYpunto()]],
      password: ['', Validators.required],
      clientesAutorizados: [[]],
      esTecnico: [false],
      haveTickets: [false],
    });
  }

  ngOnInit(): void {
    this.formError = true;

    this.cuentaForm
      .get('email')!
      .valueChanges.pipe(
        debounceTime(600),
        switchMap((email) => {
          return this.apiService.verificarCorreoExistente(email).pipe();
        })
      )
      .subscribe((isTaken) => {
        this.correoExistente$.next(isTaken);
        this.formError = isTaken;
      });

    this.cargarClientesDisponibles();

    this.cuentaForm.get('tipoCuentaId')?.valueChanges.subscribe((valor) => {
      const esAdmin = valor === '1' || valor === 1;
      if (!esAdmin) {
        this.cuentaForm.get('esTecnico')?.setValue(false);
      }
      const esCliente = valor === '4' || valor === 4;
      if (!esCliente) {
        this.cuentaForm.get('haveTickets')?.setValue(false);
      }
      if (esCliente) {
        return;
      }
      this.limpiarSelecciones();
    });
  }

  @HostListener('document:click')
  cerrarDropdownPorDocumento(): void {
    if (!this.clientesDropdownAbierto) {
      return;
    }
    this.clientesDropdownAbierto = false;
  }

  get esRolClienteSeleccionado(): boolean {
    const valor = this.cuentaForm.get('tipoCuentaId')?.value;
    return valor === '4' || valor === 4;
  }

  get esRolAdminSeleccionado(): boolean {
    const valor = this.cuentaForm.get('tipoCuentaId')?.value;
    return valor === '1' || valor === 1;
  }

  verificarFormulario(): boolean {
    return (
      this.cuentaForm.invalid ||
      this.correoExistente$.getValue() ||
      this.formError
    );
  }

  validacionCampoCorreo(_: Event): void {
    this.formError = true;
    this.correoExistente$.next(false);
  }

  abrirModal(): void {
    this.isVisible = true;
  }

  cerrar(): void {
    this.isVisible = false;
    this.cuentaForm.reset({
      clientesAutorizados: [],
      esTecnico: false,
      haveTickets: false,
    });
    this.errorMessage = '';
    this.limpiarSelecciones();
    this.cerrarModal.emit();
  }

  onSubmit(): void {
    if (!this.cuentaForm.valid) {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }

    console.log('Formulario enviado:', this.cuentaForm.value);
    this.enviarFormulario.emit(this.cuentaForm.value);
    this.cerrar();
  }

  changeSelectColor(event: Event): void {
    const element = event.currentTarget as HTMLSelectElement;
    element.classList.add('colorSelect');
  }

  toggleClientesDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (
      !this.esRolClienteSeleccionado ||
      this.clientesDisponibles.length === 0
    ) {
      return;
    }
    this.clientesDropdownAbierto = !this.clientesDropdownAbierto;
  }

  onToggleCliente(cliente: ClienteResumen, event?: MouseEvent): void {
    event?.stopPropagation();
    const index = this.clientesSeleccionados.findIndex(
      (item) => item.id === cliente.id
    );
    if (index >= 0) {
      this.clientesSeleccionados.splice(index, 1);
    } else {
      this.clientesSeleccionados.push(cliente);
    }
    this.actualizarControlClientes();
  }

  estaClienteSeleccionado(id: string): boolean {
    return this.clientesSeleccionados.some((cliente) => cliente.id === id);
  }

  private cargarClientesDisponibles(): void {
    this.apiService.clientesResumen().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes ?? [];
      },
      error: () => {
        this.clientesDisponibles = [];
      },
    });
  }

  private limpiarSelecciones(): void {
    this.clientesSeleccionados = [];
    this.clientesDropdownAbierto = false;
    this.cuentaForm.get('clientesAutorizados')?.setValue([]);
  }

  private actualizarControlClientes(): void {
    const ids = this.clientesSeleccionados.map((cliente) => cliente.id);
    this.cuentaForm.get('clientesAutorizados')?.setValue(ids);
  }
}
