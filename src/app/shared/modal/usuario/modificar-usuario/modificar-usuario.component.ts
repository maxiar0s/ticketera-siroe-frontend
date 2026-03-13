import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';
import { ClienteResumen } from '../../../../interfaces/cliente-resumen.interface';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { FormatInputSoloNumerosDirective } from '../../../../directives/solo-numeros.directive';
import {
  buildModuleAccessByOccupation,
  buildDefaultModuleAccess,
  ModuleGroupConfig,
  MODULE_GROUPS,
  MODULE_LABELS,
  ModuleAccessMap,
  ModuleKey,
  normalizeOccupationLabel,
  normalizeModuleAccess,
  OCCUPATIONS,
  STANDALONE_MODULE_KEYS,
} from '../../../../config/modules';

@Component({
  selector: 'shared-modificar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatInputSoloNumerosDirective],
  templateUrl: './modificar-usuario.component.html',
  styleUrl: './modificar-usuario.component.css',
})
export class ModificarUsuarioComponent {
  @Input() usuario?: Cuenta;
  @Input() soloLectura = false;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public usuarioForm: FormGroup;

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
      ocupacion: [null],
      haveTickets: [false],
      modulosAcceso: [buildDefaultModuleAccess(true)],
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
      ocupacion: normalizeOccupationLabel(this.usuario?.ocupacion),
      haveTickets: this.usuario ? !!this.usuario.haveTickets : false,
      modulosAcceso: normalizeModuleAccess(
        this.usuario?.modulosAcceso,
        buildModuleAccessByOccupation(this.usuario?.ocupacion),
      ),
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
      const esCliente = valor === '4' || valor === 4;
      if (!esCliente) {
        this.usuarioForm.get('haveTickets')?.setValue(false);
      }
      if (esCliente) {
        this.usuarioForm.get('ocupacion')?.setValue(null);
        this.actualizarEstadoOcupacion();
        return;
      }
      this.limpiarSelecciones();
      this.actualizarEstadoOcupacion();
    });

    this.usuarioForm.get('esTecnico')?.valueChanges.subscribe(() => {
      this.actualizarEstadoOcupacion();
    });

    this.usuarioForm.get('ocupacion')?.valueChanges.subscribe((ocupacion) => {
      if (!this.puedeSeleccionarOcupacion || !ocupacion || this.soloLectura) {
        return;
      }

      this.usuarioForm
        .get('modulosAcceso')
        ?.setValue(buildModuleAccessByOccupation(ocupacion));
    });

    this.actualizarEstadoOcupacion();

    if (this.soloLectura) {
      this.usuarioForm.disable({ emitEvent: false });
    }
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

  get esRolTecnicoSeleccionado(): boolean {
    const valor = this.usuarioForm.get('tipoCuentaId')?.value;
    return valor === '2' || valor === 2;
  }

  get puedeSeleccionarOcupacion(): boolean {
    return this.esRolTecnicoSeleccionado || this.esRolAdminSeleccionado;
  }

  get requiereOcupacion(): boolean {
    return this.esRolTecnicoSeleccionado ||
      (this.esRolAdminSeleccionado && !!this.usuarioForm.get('esTecnico')?.value);
  }

  abrirModal(): void {
    this.isVisible = true;
  }

  cerrar(): void {
    this.isVisible = false;
    this.usuarioForm.reset({
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
    if (this.soloLectura) {
      this.cerrar();
      return;
    }

    if (!this.usuarioForm.valid) {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }

    const payload = { ...this.usuarioForm.value };
    if (!payload.password) {
      delete payload.password;
    }

    this.enviarFormulario.emit(payload);
    this.cerrar();
  }

  get modulosAccesoSeleccionados(): ModuleAccessMap {
    return normalizeModuleAccess(this.usuarioForm.get('modulosAcceso')?.value);
  }

  aplicarAccesoATodosLosModulos(enabled: boolean): void {
    if (this.soloLectura) {
      return;
    }

    const modulos = buildDefaultModuleAccess(enabled);
    modulos.dashboardCliente = modulos.dashboard;
    this.usuarioForm.get('modulosAcceso')?.setValue(modulos);
  }

  actualizarAccesoModulo(moduleKey: ModuleKey, event: Event): void {
    if (this.soloLectura) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const actualizados = {
      ...this.modulosAccesoSeleccionados,
      [moduleKey]: input.checked,
    };

    if (moduleKey === 'dashboard') {
      actualizados.dashboardCliente = input.checked;
    }

    this.usuarioForm.get('modulosAcceso')?.setValue(actualizados);
  }

  toggleModuleGroup(groupId: string): void {
    this.expandedModuleGroups[groupId] = !this.expandedModuleGroups[groupId];
  }

  grupoSeleccionado(group: ModuleGroupConfig): boolean {
    const keys = this.obtenerClavesGrupo(group);
    return keys.every((key) => this.modulosAccesoSeleccionados[key]);
  }

  grupoParcialmenteSeleccionado(group: ModuleGroupConfig): boolean {
    const keys = this.obtenerClavesGrupo(group);
    const selectedCount = keys.filter(
      (key) => this.modulosAccesoSeleccionados[key],
    ).length;

    return selectedCount > 0 && selectedCount < keys.length;
  }

  contarModulosSeleccionados(group: ModuleGroupConfig): number {
    return this.obtenerClavesGrupo(group).filter(
      (key) => this.modulosAccesoSeleccionados[key],
    ).length;
  }

  contarModulosStandaloneSeleccionados(): number {
    return this.standaloneModuleOptions.filter(
      (moduleOption) => this.modulosAccesoSeleccionados[moduleOption.key],
    ).length;
  }

  moduloSeleccionado(moduleKey: ModuleKey): boolean {
    return !!this.modulosAccesoSeleccionados[moduleKey];
  }

  actualizarGrupoModulos(group: ModuleGroupConfig, event: Event): void {
    if (this.soloLectura) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const actualizados = { ...this.modulosAccesoSeleccionados };

    this.obtenerClavesGrupo(group).forEach((key) => {
      actualizados[key] = input.checked;
    });

    this.usuarioForm.get('modulosAcceso')?.setValue(actualizados);
  }

  moduleOptionLabel(moduleKey: ModuleKey): string {
    return MODULE_LABELS[moduleKey];
  }

  toggleClientesDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.soloLectura) {
      return;
    }

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

    if (this.soloLectura) {
      return;
    }

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
    this.usuarioForm.get('clientesAutorizados')?.setValue([]);
  }

  private actualizarControlClientes(): void {
    const ids = this.clientesSeleccionados.map((cliente) => cliente.id);
    this.usuarioForm.get('clientesAutorizados')?.setValue(ids);
  }

  private actualizarEstadoOcupacion(): void {
    const occupationControl = this.usuarioForm.get('ocupacion');
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
