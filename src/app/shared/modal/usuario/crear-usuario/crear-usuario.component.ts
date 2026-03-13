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
import {
  buildModuleAccessByOccupation,
  buildDefaultModuleAccess,
  ModuleGroupConfig,
  MODULE_GROUPS,
  MODULE_LABELS,
  ModuleAccessMap,
  ModuleKey,
  normalizeModuleAccess,
  OCCUPATIONS,
  STANDALONE_MODULE_KEYS,
} from '../../../../config/modules';

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
  public readonly moduleGroups = MODULE_GROUPS;
  public readonly standaloneModuleOptions = STANDALONE_MODULE_KEYS.map((key) => ({
    key,
    label: MODULE_LABELS[key],
  }));
  public readonly occupationOptions = OCCUPATIONS;
  public expandedModuleGroups = this.moduleGroups.reduce(
    (accumulator, group) => {
      accumulator[group.id] = true;
      return accumulator;
    },
    {} as Record<string, boolean>,
  );

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.cuentaForm = this.fb.group({
      name: ['', Validators.required],
      tipoCuentaId: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, correoConArrobaYpunto()]],
      password: ['', Validators.required],
      clientesAutorizados: [[]],
      esTecnico: [false],
      ocupacion: [null],
      haveTickets: [false],
      modulosAcceso: [buildDefaultModuleAccess(true)],
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
        this.cuentaForm.get('ocupacion')?.setValue(null);
        this.actualizarEstadoOcupacion();
        return;
      }
      this.limpiarSelecciones();
      this.actualizarEstadoOcupacion();
    });

    this.cuentaForm.get('esTecnico')?.valueChanges.subscribe(() => {
      this.actualizarEstadoOcupacion();
    });

    this.cuentaForm.get('ocupacion')?.valueChanges.subscribe((ocupacion) => {
      if (!this.puedeSeleccionarOcupacion || !ocupacion) {
        return;
      }

      this.cuentaForm
        .get('modulosAcceso')
        ?.setValue(buildModuleAccessByOccupation(ocupacion));
    });

    this.actualizarEstadoOcupacion();
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

  get esRolTecnicoSeleccionado(): boolean {
    const valor = this.cuentaForm.get('tipoCuentaId')?.value;
    return valor === '2' || valor === 2;
  }

  get puedeSeleccionarOcupacion(): boolean {
    return this.esRolTecnicoSeleccionado || this.esRolAdminSeleccionado;
  }

  get requiereOcupacion(): boolean {
    return this.esRolTecnicoSeleccionado ||
      (this.esRolAdminSeleccionado && !!this.cuentaForm.get('esTecnico')?.value);
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
      ocupacion: null,
      haveTickets: false,
      modulosAcceso: buildDefaultModuleAccess(true),
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

  get modulosAccesoSeleccionados(): ModuleAccessMap {
    return normalizeModuleAccess(this.cuentaForm.get('modulosAcceso')?.value);
  }

  aplicarAccesoATodosLosModulos(enabled: boolean): void {
    const modulos = buildDefaultModuleAccess(enabled);
    modulos.dashboardCliente = modulos.dashboard;
    this.cuentaForm.get('modulosAcceso')?.setValue(modulos);
  }

  actualizarAccesoModulo(moduleKey: ModuleKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const actualizados = {
      ...this.modulosAccesoSeleccionados,
      [moduleKey]: input.checked,
    };

    if (moduleKey === 'dashboard') {
      actualizados.dashboardCliente = input.checked;
    }

    this.cuentaForm.get('modulosAcceso')?.setValue(actualizados);
  }

  toggleModuleGroup(groupId: string): void {
    this.expandedModuleGroups[groupId] = !this.expandedModuleGroups[groupId];
  }

  grupoSeleccionado(group: ModuleGroupConfig): boolean {
    const keys = this.obtenerClavesGrupo(group);
    return keys.every((key) => this.modulosAccesoSeleccionados[key]);
  }

  actualizarGrupoModulos(group: ModuleGroupConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    const actualizados = { ...this.modulosAccesoSeleccionados };

    this.obtenerClavesGrupo(group).forEach((key) => {
      actualizados[key] = input.checked;
    });

    this.cuentaForm.get('modulosAcceso')?.setValue(actualizados);
  }

  moduleOptionLabel(moduleKey: ModuleKey): string {
    return MODULE_LABELS[moduleKey];
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

    // Para rol Cliente, solo permitir 1 cliente (selección única)
    if (this.esRolClienteSeleccionado) {
      if (this.estaClienteSeleccionado(cliente.id)) {
        this.clientesSeleccionados = [];
      } else {
        this.clientesSeleccionados = [cliente];
      }
      this.clientesDropdownAbierto = false;
      this.actualizarControlClientes();
      return;
    }

    // Para otros roles, mantener comportamiento multiselect
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

  private actualizarEstadoOcupacion(): void {
    const occupationControl = this.cuentaForm.get('ocupacion');
    if (!occupationControl) {
      return;
    }

    if (!this.puedeSeleccionarOcupacion) {
      occupationControl.clearValidators();
      occupationControl.setValue(null, { emitEvent: false });
      occupationControl.updateValueAndValidity({ emitEvent: false });
      return;
    }

    if (this.requiereOcupacion) {
      occupationControl.setValidators([Validators.required]);
    } else {
      occupationControl.clearValidators();
    }

    occupationControl.updateValueAndValidity({ emitEvent: false });
  }

  private obtenerClavesGrupo(group: ModuleGroupConfig): ModuleKey[] {
    return group.moduleKey
      ? [group.moduleKey, ...group.children]
      : [...group.children];
  }
}
