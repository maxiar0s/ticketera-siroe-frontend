import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';
import { ClienteResumen } from '../../../../interfaces/cliente-resumen.interface';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { FormatInputSoloNumerosDirective } from '../../../../directives/solo-numeros.directive';

@Component({
  selector: 'shared-modificar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputSoloNumerosDirective],
  templateUrl: './modificar-usuario.component.html',
  styleUrl: './modificar-usuario.component.css'
})
export class ModificarUsuarioComponent {
  @Input() usuario?: Cuenta;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public usuarioForm: FormGroup;

  public isVisible: boolean = true;
  public errorMessage: string = '';

  public clientesDisponibles: ClienteResumen[] = [];
  public clientesSeleccionados: ClienteResumen[] = [];
  public clientesDropdownAbierto: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public loaderService: LoaderService
  ) {
    this.usuarioForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      tipoCuentaId: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      password: [''],
      estadoCuentaId: ['', Validators.required],
      clientesAutorizados: [[]],
      esTecnico: [false],
    });
  }

  ngOnInit(): void {
    this.usuarioForm.patchValue({
      id: this.usuario ? this.usuario.id : '',
      name: this.usuario ? this.usuario.name : '',
      tipoCuentaId: this.usuario ? this.usuario.tipoCuentaId : '',
      telefono: this.usuario ? this.usuario.telefono : '',
      estadoCuentaId: this.usuario ? this.usuario.estadoCuentaId : '',
      esTecnico: this.usuario ? !!this.usuario.esTecnico : false,
    });

    this.clientesSeleccionados = this.usuario?.clientesAutorizados
      ? [...this.usuario.clientesAutorizados]
      : [];
    this.actualizarControlClientes();

    this.cargarClientesDisponibles();

    this.usuarioForm.get('tipoCuentaId')?.valueChanges.subscribe((valor) => {
      const esAdmin = valor === '1' || valor === 1;
      if (!esAdmin) {
        this.usuarioForm.get('esTecnico')?.setValue(false);
      }
      if (valor === '4' || valor === 4) {
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
    const valor = this.usuarioForm.get('tipoCuentaId')?.value;
    return valor === '4' || valor === 4;
  }

  get esRolAdminSeleccionado(): boolean {
    const valor = this.usuarioForm.get('tipoCuentaId')?.value;
    return valor === '1' || valor === 1;
  }

  abrirModal(): void {
    this.isVisible = true;
  }

  cerrar(): void {
    this.isVisible = false;
    this.usuarioForm.reset({ clientesAutorizados: [], esTecnico: false });
    this.errorMessage = '';
    this.limpiarSelecciones();
    this.cerrarModal.emit();
  }

  onSubmit(): void {
    if (!this.usuarioForm.valid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }

    const payload = { ...this.usuarioForm.value };
    if (!payload.password) {
      delete payload.password;
    }

    this.enviarFormulario.emit(payload);
    this.cerrar();
  }

  toggleClientesDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.esRolClienteSeleccionado || this.clientesDisponibles.length === 0) {
      return;
    }

    this.clientesDropdownAbierto = !this.clientesDropdownAbierto;
  }

  onToggleCliente(cliente: ClienteResumen, event?: MouseEvent): void {
    event?.stopPropagation();
    const index = this.clientesSeleccionados.findIndex((item) => item.id === cliente.id);

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
    this.usuarioForm.get('clientesAutorizados')?.setValue([]);
  }

  private actualizarControlClientes(): void {
    const ids = this.clientesSeleccionados.map((cliente) => cliente.id);
    this.usuarioForm.get('clientesAutorizados')?.setValue(ids);
  }
}
