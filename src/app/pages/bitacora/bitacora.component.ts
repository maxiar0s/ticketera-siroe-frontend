import { CommonModule } from '@angular/common';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { Bitacora } from '../../interfaces/bitacora.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { Cuenta } from '../../interfaces/Cuenta.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
import { Proyecto } from '../../interfaces/proyecto.interface';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SignalService } from '../../services/signal.service';

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatoFechaPipe],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css',
})
export class BitacoraComponent implements OnInit {
  filtroForm: FormGroup;
  bitacoraForm: FormGroup;

  bitacoras: Bitacora[] = [];
  bitacoraSeleccionada?: Bitacora;
  private bitacoraDestinoId: number | null = null;

  clientes: ClienteResumen[] = [];
  sucursalesFiltro: SucursalOption[] = [];
  sucursalesFormulario: SucursalOption[] = [];
  private sucursalesCache = new Map<string, SucursalOption[]>();
  tecnicosDisponibles: Tecnico[] = [];
  proyectos: Proyecto[] = [];

  paginaActual = 1;
  paginasTotales = 0;
  limite = 10;

  cargando = false;
  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';

  formularioVisible = false;
  modoEdicion = false;
  selectedIngresoFiles: File[] = [];
  selectedEvidenceFiles: File[] = [];
  eliminandoBitacoraId: number | null = null;
  tecnicosDropdownAbierto = false;
  detalleVisible = false;

  readonly esAdmin: boolean;
  readonly esTecnico: boolean;
  readonly esMesaAyuda: boolean;
  readonly esComercial: boolean;
  readonly esCliente: boolean;
  readonly puedeCrear: boolean;
  readonly soloLectura: boolean;
  readonly opcionesFiltroTipo = [
    { value: 'ambos', label: 'Ambos' },
    { value: 'bitacora', label: 'Bitacora' },
    { value: 'ticket', label: 'Ticket' },
  ];
  readonly estadosTicket = [
    { value: 'ingresado', label: 'Abierto' },
    { value: 'terminado', label: 'Cerrado' },
  ] as const;

  tieneAccesoTickets = true;
  perfilTieneTickets = false;
  tituloModulo = 'Bitacora de visitas';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private signalService: SignalService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.esAdmin = this.authService.esAdministrador();
    this.esTecnico = this.authService.esTecnico();
    this.esMesaAyuda = this.authService.esMesaAyuda();
    this.esComercial = this.authService.esComercial();
    this.esCliente = this.authService.esCliente();
    this.puedeCrear = this.esAdmin || this.esTecnico;
    this.soloLectura = this.esMesaAyuda || this.esCliente || this.esComercial;

    this.filtroForm = this.fb.group({
      clienteId: [''],
      sucursalId: [''],
      buscar: [''],
      tipo: ['ambos'],
      proyectoId: [''],
    });

    this.bitacoraForm = this.fb.group({
      id: [null],
      titulo: [''],
      clienteId: ['', Validators.required],
      sucursalId: [''],
      fechaVisita: ['', Validators.required],
      horaLlegada: [''],
      horaSalida: [''],
      tecnicos: [[], Validators.required],
      isEmergencia: [false],
      esTicket: [false],
      ticketEstado: ['ingresado'],
      ticketFechaTermino: [''],
      ticketDetalleTermino: [''],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      proyectoId: [null],
    });

    this.configurarValidacionesDinamicas();

    const navigation = this.router.getCurrentNavigation();
    const objetivo = navigation?.extras?.state
      ? (navigation.extras.state as Record<string, unknown>)['bitacoraId']
      : null;
    const parsed = Number.parseInt(`${objetivo ?? ''}`, 10);
    if (!Number.isNaN(parsed)) {
      this.bitacoraDestinoId = parsed;
    }
  }

  private configurarValidacionesDinamicas(): void {
    const esTicketCtrl = this.bitacoraForm.get('esTicket');
    const estadoCtrl = this.bitacoraForm.get('ticketEstado');
    const horaLlegadaCtrl = this.bitacoraForm.get('horaLlegada');
    const horaSalidaCtrl = this.bitacoraForm.get('horaSalida');
    const fechaTerminoCtrl = this.bitacoraForm.get('ticketFechaTermino');
    const detalleTerminoCtrl = this.bitacoraForm.get('ticketDetalleTermino');

    if (!esTicketCtrl || !estadoCtrl) {
      return;
    }

    const aplicarValidaciones = () => {
      const esTicket = !!esTicketCtrl.value;
      const estado = (estadoCtrl.value ?? 'ingresado') as 'ingresado' | 'terminado';

      if (esTicket) {
        if (!estado) {
          estadoCtrl.setValue('ingresado', { emitEvent: false });
        }
        horaLlegadaCtrl?.clearValidators();
        horaSalidaCtrl?.clearValidators();

        if (estado === 'terminado') {
          fechaTerminoCtrl?.setValidators([Validators.required]);
          detalleTerminoCtrl?.setValidators([Validators.required, Validators.minLength(5)]);
        } else {
          fechaTerminoCtrl?.setValue('', { emitEvent: false });
          detalleTerminoCtrl?.setValue('', { emitEvent: false });
          fechaTerminoCtrl?.clearValidators();
          detalleTerminoCtrl?.clearValidators();
          if (this.selectedEvidenceFiles.length) {
            this.selectedEvidenceFiles = [];
          }
        }
      } else {
        if (estado !== 'ingresado') {
          estadoCtrl.setValue('ingresado', { emitEvent: false });
        }
        horaLlegadaCtrl?.clearValidators();
        horaSalidaCtrl?.clearValidators();
        fechaTerminoCtrl?.setValue('', { emitEvent: false });
        detalleTerminoCtrl?.setValue('', { emitEvent: false });
        fechaTerminoCtrl?.clearValidators();
        detalleTerminoCtrl?.clearValidators();
        if (this.selectedEvidenceFiles.length) {
          this.selectedEvidenceFiles = [];
        }
      }

      horaLlegadaCtrl?.updateValueAndValidity({ emitEvent: false });
      horaSalidaCtrl?.updateValueAndValidity({ emitEvent: false });
      fechaTerminoCtrl?.updateValueAndValidity({ emitEvent: false });
      detalleTerminoCtrl?.updateValueAndValidity({ emitEvent: false });
    };

    esTicketCtrl.valueChanges.subscribe(() => aplicarValidaciones());
    estadoCtrl.valueChanges.subscribe(() => aplicarValidaciones());
    aplicarValidaciones();
  }

  downloadAdjunto(fileName: string): void {
    if (!fileName) {
      console.error('Nombre de archivo no proporcionado');
      return;
    }

    this.apiService.signedUrl(fileName).subscribe({
      next: (url) => {
        if (url) {
          // Crear un enlace temporal y simular clic para la descarga
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.split('/').pop() || fileName; // Usar solo el nombre del archivo, no la ruta completa
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          console.error('URL firmada no disponible');
          this.errorMensaje = 'No se pudo descargar el archivo. URL no disponible.';
        }
      },
      error: (err) => {
        console.error('Error al obtener URL firmada:', err);
        this.errorMensaje = 'Error al descargar el archivo. Por favor, intenta nuevamente.';
      },
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('bitacoraId');
      if (!idParam) {
        return;
      }
      const parsed = Number.parseInt(idParam, 10);
      if (!Number.isNaN(parsed)) {
        this.bitacoraDestinoId = parsed;
      }
    });

    this.apiService.perfilActual().subscribe({
      next: (perfil: Cuenta) => {
        const rolTieneTickets =
          this.esAdmin || this.esTecnico || this.esComercial;
        const tieneTickets = rolTieneTickets || !!perfil?.haveTickets;
        this.perfilTieneTickets = tieneTickets;
        if (tieneTickets) {
          this.tituloModulo = 'Bitacora / Tickets';
        }

        this.tieneAccesoTickets = !this.esCliente || tieneTickets;
        this.signalService.updateData(this.tituloModulo);

        if (this.tieneAccesoTickets) {
          this.errorMensaje = '';
          this.cargarClientes();
          this.cargarTecnicosDisponibles();
          this.cargarProyectos();
        } else {
          this.bitacoras = [];
          this.paginasTotales = 0;
          this.errorMensaje = 'Tu cuenta no tiene acceso a Tickets.';
        }
      },
      error: (error) => {
        console.error('Error al cargar perfil para bitacora', error);
        const rolTieneTickets =
          this.esAdmin || this.esTecnico || this.esComercial;
        this.perfilTieneTickets = rolTieneTickets;
        if (rolTieneTickets) {
          this.tituloModulo = 'Bitacora / Tickets';
        }
        this.tieneAccesoTickets = !this.esCliente || rolTieneTickets;
        this.signalService.updateData(this.tituloModulo);

        if (this.tieneAccesoTickets) {
          this.cargarClientes();
          this.cargarTecnicosDisponibles();
          this.cargarProyectos();
        } else {
          this.bitacoras = [];
          this.paginasTotales = 0;
          this.errorMensaje =
            'No se pudo verificar el acceso a Tickets para esta cuenta.';
        }
      },
    });
  }

  private cargarClientes(): void {
    if (!this.tieneAccesoTickets) {
      return;
    }

    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : [];
        const clienteActual = this.filtroForm.value.clienteId;

        if (!clienteActual && this.clientes.length === 1) {
          const unico = this.clientes[0];
          this.filtroForm.patchValue({ clienteId: unico.id }, { emitEvent: false });
          this.cargarSucursalesParaCliente(unico.id, 'filtro');
        } else if (clienteActual) {
          this.cargarSucursalesParaCliente(clienteActual, 'filtro');
        }

        this.cargarBitacoras();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        if (error?.status === 403) {
          this.tieneAccesoTickets = false;
          this.bitacoras = [];
          this.paginasTotales = 0;
          this.errorMensaje =
            error?.error?.error ?? 'Tu cuenta no tiene acceso a Tickets.';
          return;
        }
        this.errorMensaje =
          'No fue posible obtener el listado de clientes disponibles.';
        this.cargarBitacoras();
      },
    });
  }

  private cargarTecnicosDisponibles(): void {
    this.apiService.tecnicosDisponibles().subscribe({
      next: (tecnicos) => {
        this.tecnicosDisponibles = Array.isArray(tecnicos) ? tecnicos : [];
      },
      error: () => {
        this.tecnicosDisponibles = [];
      },
    });
  }

  private cargarProyectos(): void {
    this.apiService
      .getProyectos({ pagina: 1, limite: 100 })
      .subscribe({
        next: (respuesta) => {
          const lista = Array.isArray(respuesta?.data) ? respuesta.data : [];
          this.proyectos = lista;
        },
        error: (error) => {
          console.error('Error al cargar proyectos', error);
          this.proyectos = [];
        },
      });
  }

  get tecnicosSeleccionados(): string[] {
    const value = this.bitacoraForm.get('tecnicos')?.value;
    return Array.isArray(value) ? value : [];
  }

  get resumenTecnicosSeleccionados(): string {
    const seleccionados = this.tecnicosSeleccionados;
    if (seleccionados.length === 0) {
      return 'Selecciona tecnicos';
    }
    if (seleccionados.length === 1) {
      return seleccionados[0];
    }
    return `${seleccionados.length} tecnicos seleccionados`;
  }

  get esTicketControl() {
    return this.bitacoraForm.get('esTicket');
  }

  get mostrarCamposHorarios(): boolean {
    return !this.esTicketSeleccionado || this.estadoTicketSeleccionado === 'terminado';
  }

  get esTicketSeleccionado(): boolean {
    return !!this.esTicketControl?.value;
  }

  get estadoTicketSeleccionado(): 'ingresado' | 'terminado' {
    const control = this.bitacoraForm.get('ticketEstado');
    return this.normalizarEstadoTicket(control?.value);
  }

  get mostrarCamposTerminoTicket(): boolean {
    return this.esTicketSeleccionado && this.estadoTicketSeleccionado === 'terminado';
  }

  get esTicketIngresado(): boolean {
    return this.esTicketSeleccionado && this.estadoTicketSeleccionado === 'ingresado';
  }

  campoInvalido(controlName: string): boolean {
    const control = this.bitacoraForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  mensajeError(controlName: string): string | null {
    if (!this.campoInvalido(controlName)) {
      return null;
    }

    const control = this.bitacoraForm.get(controlName);
    const errors = control?.errors ?? {};

    if (errors['required']) {
      switch (controlName) {
        case 'clienteId':
          return 'Selecciona un cliente.';
        case 'fechaVisita':
          return this.esTicketSeleccionado
            ? 'Indica la fecha de ingreso del ticket.'
            : 'Selecciona la fecha de la visita.';
        case 'tecnicos':
          return 'Selecciona al menos un tecnico.';
        case 'ticketFechaTermino':
          return 'Ingresa la fecha en la que se cerro el ticket.';
        case 'ticketDetalleTermino':
          return 'Detalla lo realizado para cerrar el ticket.';
        case 'descripcion':
          return 'Describe las actividades realizadas.';
        default:
          return 'Este campo es obligatorio.';
      }
    }

    if (errors['minlength']) {
      const requerido = errors['minlength'].requiredLength;
      switch (controlName) {
        case 'ticketDetalleTermino':
          return `Detalla lo realizado con al menos ${requerido} caracteres.`;
        case 'descripcion':
          return `El detalle debe tener al menos ${requerido} caracteres.`;
        default:
          return `Debes ingresar al menos ${requerido} caracteres.`;
      }
    }

    return 'Revisa los datos ingresados.';
  }

  toggleTecnicosDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.tecnicosDropdownAbierto = !this.tecnicosDropdownAbierto;
  }

  seleccionarTipoRegistro(valor: boolean): void {
    const control = this.esTicketControl;
    if (!control || control.disabled) {
      return;
    }
    control.setValue(valor);
    control.markAsDirty();
    control.markAsTouched();
  }

  onToggleTecnico(tecnico: Tecnico, event?: MouseEvent): void {
    event?.stopPropagation();
    const actuales = this.tecnicosSeleccionados;
    const index = actuales.indexOf(tecnico.name);
    let actualizados: string[];
    if (index >= 0) {
      actualizados = [
        ...actuales.slice(0, index),
        ...actuales.slice(index + 1),
      ];
    } else {
      actualizados = [...actuales, tecnico.name];
    }
    this.bitacoraForm.get('tecnicos')?.setValue(actualizados);
    this.bitacoraForm.get('tecnicos')?.markAsDirty();
    this.bitacoraForm.get('tecnicos')?.markAsTouched();
  }

  estaTecnicoSeleccionado(tecnico: Tecnico): boolean {
    return this.tecnicosSeleccionados.includes(tecnico.name);
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    if (this.tecnicosDropdownAbierto) {
      this.tecnicosDropdownAbierto = false;
    }
  }

  buscarBitacoras(): void {
    this.paginaActual = 1;
    this.cargarBitacoras();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      clienteId: this.esCliente && this.clientes.length === 1 ? this.clientes[0].id : '',
      sucursalId: '',
      buscar: '',
      tipo: 'ambos',
      proyectoId: '',
    });
    const clienteId = this.filtroForm.value.clienteId;
    if (clienteId) {
      this.cargarSucursalesParaCliente(clienteId, 'filtro');
    } else {
      this.sucursalesFiltro = [];
    }
    this.paginaActual = 1;
    this.cargarBitacoras();
  }

  private cargarBitacoras(mostrarLoader: boolean = true): void {
    if (mostrarLoader) {
      this.cargando = true;
    }
    this.errorMensaje = '';

    if (!this.tieneAccesoTickets) {
      this.cargando = false;
      this.bitacoras = [];
      this.paginasTotales = 0;
      return;
    }

    const filtros = this.filtroForm.getRawValue();
    const params: Record<string, any> = {
      pagina: this.paginaActual,
      limite: this.limite,
      clienteId: filtros.clienteId,
      sucursalId: filtros.sucursalId,
      buscar: filtros.buscar,
    };
    if (filtros.tipo && filtros.tipo !== 'ambos') {
      params['tipo'] = filtros.tipo;
    }
    if (filtros.proyectoId) {
      if (filtros.proyectoId === 'sin-proyecto') {
        params['sinProyecto'] = 'true';
      } else {
        params['proyectoId'] = filtros.proyectoId;
      }
    }

    this.apiService
      .bitacoras(params)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          const data = respuesta?.data ?? [];
          this.bitacoras = data;
          this.paginasTotales = respuesta?.paginasTotales ?? 0;
          this.paginaActual = respuesta?.pagina ?? 1;
          if (this.bitacoraSeleccionada) {
            const actualizada = data.find(
              (item: Bitacora) => item.id === this.bitacoraSeleccionada?.id
            );
            this.bitacoraSeleccionada = actualizada;
          }
          this.procesarBitacoraDestino();
        },
        error: (error) => {
          console.error('Error al cargar bitacoras', error);
          if (error?.status === 403) {
            this.tieneAccesoTickets = false;
            this.bitacoras = [];
            this.paginasTotales = 0;
            this.errorMensaje =
              error?.error?.error ?? 'Tu cuenta no tiene acceso a Tickets.';
            return;
          }
          this.errorMensaje =
            error?.error?.error ??
            'Ocurrio un error al intentar obtener las bitacoras.';
          this.bitacoras = [];
          this.paginasTotales = 0;
        },
      });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.paginasTotales || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarBitacoras();
  }

  private procesarBitacoraDestino(): void {
    if (!this.bitacoraDestinoId) {
      return;
    }
    const objetivo = this.bitacoras.find(
      (item: Bitacora) => item.id === this.bitacoraDestinoId
    );
    if (!objetivo) {
      return;
    }
    this.bitacoraSeleccionada = objetivo;
    if (this.puedeEditarBitacora(objetivo)) {
      this.abrirFormularioEditar(objetivo);
    } else {
      this.seleccionarBitacora(objetivo);
    }
    this.bitacoraDestinoId = null;
    this.limpiarParametrosDestino();
  }

  private limpiarParametrosDestino(): void {
    this.router.navigate([], {
      queryParams: { bitacoraId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  seleccionarBitacora(bitacora: Bitacora): void {
    this.bitacoraSeleccionada = bitacora;
    this.detalleVisible = true;
  }

  cerrarDetalle(): void {
    this.detalleVisible = false;
    this.bitacoraSeleccionada = undefined;
  }

  puedeEditarBitacora(_bitacora: Bitacora): boolean {
    return this.esAdmin || this.esTecnico;
  }

  abrirFormularioCrear(): void {
    if (!this.puedeCrear) {
      return;
    }

    this.detalleVisible = false;
    this.bitacoraSeleccionada = undefined;
    this.habilitarTodosLosControles();
    const clienteId =
      this.filtroForm.value.clienteId ||
      (this.clientes.length === 1 ? this.clientes[0].id : '');

    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.bitacoraForm.reset({
      id: null,
      titulo: '',
      clienteId,
      sucursalId: '',
      fechaVisita: this.obtenerFechaActual(),
      horaLlegada: '',
      horaSalida: '',
      tecnicos: [],
      isEmergencia: false,
      esTicket: false,
      ticketEstado: 'ingresado',
      ticketFechaTermino: '',
      ticketDetalleTermino: '',
      descripcion: '',
      proyectoId: null,
    });

    this.formularioVisible = true;
    this.modoEdicion = false;
    this.exitoMensaje = '';
    this.errorMensaje = '';

    if (clienteId) {
      this.cargarSucursalesParaCliente(clienteId, 'form');
    } else {
      this.sucursalesFormulario = [];
    }
  }

  abrirFormularioEditar(bitacora: Bitacora, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeEditarBitacora(bitacora)) {
      return;
    }

    this.detalleVisible = false;
    this.habilitarTodosLosControles();
    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.bitacoraForm.reset({
      id: bitacora.id,
      titulo: bitacora.titulo ?? '',
      clienteId: bitacora.casaMatrizId,
      sucursalId: bitacora.sucursalId ?? '',
      fechaVisita: bitacora.fechaVisita?.slice(0, 10) ?? '',
      horaLlegada: this.formatearParaInputFecha(bitacora.horaLlegada),
      horaSalida: this.formatearParaInputFecha(bitacora.horaSalida),
      tecnicos: Array.isArray(bitacora.tecnicos) ? [...bitacora.tecnicos] : [],
      isEmergencia: !!bitacora.isEmergencia,
      esTicket: !!bitacora.esTicket,
      ticketEstado: this.normalizarEstadoTicket(bitacora.estadoTicket),
      ticketFechaTermino: this.formatearParaInputSoloFecha(bitacora.fechaTermino),
      ticketDetalleTermino: bitacora.detalleTermino ?? '',
      descripcion: bitacora.descripcion,
      proyectoId: bitacora.proyectoId ?? null,
    });

    this.formularioVisible = true;
    this.modoEdicion = true;
    this.exitoMensaje = '';
    this.errorMensaje = '';

    const clienteId = bitacora.casaMatrizId;
    this.cargarSucursalesParaCliente(clienteId, 'form', () => {
      this.bitacoraForm.patchValue({
        sucursalId: bitacora.sucursalId ?? '',
      });
    });

  }

  cerrarFormulario(): void {
    this.formularioVisible = false;
    this.modoEdicion = false;
    this.guardando = false;
    this.bitacoraForm.reset({
      isEmergencia: false,
      esTicket: false,
      tecnicos: [],
      ticketEstado: 'ingresado',
      ticketFechaTermino: '',
      ticketDetalleTermino: '',
      proyectoId: null,
    });
    this.sucursalesFormulario = [];
    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.habilitarTodosLosControles();
  }

  guardarBitacora(): void {
    if (this.guardando) {
      return;
    }

    if (this.bitacoraForm.invalid) {
      this.bitacoraForm.markAllAsTouched();
      return;
    }

    const formValue = this.bitacoraForm.getRawValue();
    const esEdicion = this.modoEdicion && formValue.id;
    let payload: any | null = null;

    if (esEdicion) {
      payload = this.construirPayloadCompleto(formValue);
    } else {
      payload = this.construirPayloadCompleto(formValue);
    }

    if (!payload) {
      this.errorMensaje =
        'Debes ingresar al menos un tecnico responsable para la visita.';
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    let solicitud$;

    // Si hay archivos seleccionados, enviamos FormData
    if (this.selectedIngresoFiles.length || this.selectedEvidenceFiles.length) {
      const formData = new FormData();
      // adjuntamos payload como JSON en campo 'payload'
      formData.append('payload', JSON.stringify(payload));
      this.selectedIngresoFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });
      this.selectedEvidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file, file.name);
      });

      if (esEdicion) {
        solicitud$ = this.apiService.actualizarBitacora(formValue.id, formData);
      } else {
        solicitud$ = this.apiService.crearBitacora(formData);
      }
    } else {
      solicitud$ = esEdicion
        ? this.apiService.actualizarBitacora(formValue.id, payload)
        : this.apiService.crearBitacora(payload);
    }

    solicitud$
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (respuesta) => {
          this.exitoMensaje = esEdicion
            ? 'Bitacora actualizada correctamente.'
            : 'Bitacora registrada correctamente.';
          this.cerrarFormulario();
          if (esEdicion) {
            this.cargarBitacoras(false);
            this.refrescarBitacora(formValue.id);
          } else {
            this.paginaActual = 1;
            this.cargarBitacoras();
            if (respuesta?.id) {
              this.refrescarBitacora(respuesta.id);
            }
          }
        },
        error: (error) => {
          console.error('Error al guardar bitacora', error);
          this.errorMensaje =
            error?.error?.error ?? 'No se pudo guardar la bitacora.';
        },
      });
  }

  onFilesSelected(event: Event, tipo: 'ingreso' | 'evidencia'): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) {
      return;
    }

    const destino =
      tipo === 'evidencia' ? this.selectedEvidenceFiles : this.selectedIngresoFiles;
    files.forEach((file) => destino.push(file));
    if (input) {
      input.value = '';
    }
  }

  removeSelectedFile(index: number, tipo: 'ingreso' | 'evidencia'): void {
    const destino =
      tipo === 'evidencia' ? this.selectedEvidenceFiles : this.selectedIngresoFiles;
    if (index >= 0 && index < destino.length) {
      destino.splice(index, 1);
    }
  }

  onClienteFiltroChange(clienteId: string): void {
    this.filtroForm.patchValue({ sucursalId: '' }, { emitEvent: false });
    if (!clienteId) {
      this.sucursalesFiltro = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'filtro');
  }

  onClienteFormChange(clienteId: string): void {
    this.bitacoraForm.patchValue({ sucursalId: '' });
    if (!clienteId) {
      this.sucursalesFormulario = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'form');
  }

  private cargarSucursalesParaCliente(
    clienteId: string,
    contexto: 'filtro' | 'form',
    callback?: () => void
  ): void {
    if (!clienteId) {
      if (contexto === 'filtro') {
        this.sucursalesFiltro = [];
      } else {
        this.sucursalesFormulario = [];
      }
      callback?.();
      return;
    }

    if (this.sucursalesCache.has(clienteId)) {
      const listado = this.sucursalesCache.get(clienteId) ?? [];
      if (contexto === 'filtro') {
        this.sucursalesFiltro = listado;
      } else {
        this.sucursalesFormulario = listado;
      }
      callback?.();
      return;
    }

    this.apiService.sucursalesPorCliente(clienteId).subscribe({
      next: (sucursales) => {
        const opciones =
          (sucursales ?? []).map((item: any) => ({
            id: item.id,
            sucursal: item.sucursal,
            estado: item.estado,
          })) ?? [];
        this.sucursalesCache.set(clienteId, opciones);
        if (contexto === 'filtro') {
          this.sucursalesFiltro = opciones;
        } else {
          this.sucursalesFormulario = opciones;
        }
        callback?.();
      },
      error: (error) => {
        console.error('Error al cargar sucursales', error);
        if (contexto === 'filtro') {
          this.sucursalesFiltro = [];
        } else {
          this.sucursalesFormulario = [];
        }
        callback?.();
      },
    });
  }

  private construirPayloadCompleto(formValue: any): any | null {
    const tecnicosEntrada = Array.isArray(formValue.tecnicos)
      ? formValue.tecnicos
      : [];
    const tecnicos = tecnicosEntrada
      .map((item: string) => `${item}`.trim())
      .filter((item: string) => item.length > 0);

    if (tecnicos.length === 0) {
      return null;
    }

    let proyectoId: number | null = null;
    if (Object.prototype.hasOwnProperty.call(formValue, 'proyectoId')) {
      const valor = `${formValue.proyectoId ?? ''}`.trim();
      if (valor && valor.toLowerCase() !== 'null') {
        const parsed = Number(valor);
        if (!Number.isNaN(parsed)) {
          proyectoId = parsed;
        }
      }
    }

    const esTicket = !!formValue.esTicket;
    const estadoTicket = esTicket
      ? this.normalizarEstadoTicket(formValue.ticketEstado)
      : null;

    const payload: any = {
      casaMatrizId: formValue.clienteId,
      sucursalId: formValue.sucursalId || null,
      fechaVisita: formValue.fechaVisita,
      horaLlegada: this.formatearAISO(formValue.horaLlegada),
      horaSalida: this.formatearAISO(formValue.horaSalida),
      tecnicos,
      descripcion: formValue.descripcion.trim(),
      titulo: formValue.titulo ? formValue.titulo.trim() : null,
      isEmergencia: !!formValue.isEmergencia,
      esTicket,
      estadoTicket,
      proyectoId,
      fechaTermino: null,
      detalleTermino: null,
    };
    payload.tecnicosIds = this.obtenerIdsTecnicosSeleccionados(tecnicos);

    if (!esTicket) {
      return payload;
    }

    // Para tickets permitimos dejar horas sin registrar
    payload.horaLlegada = this.formatearAISO(formValue.horaLlegada) ?? null;
    payload.horaSalida = this.formatearAISO(formValue.horaSalida) ?? null;

    if (estadoTicket === 'terminado') {
      const fechaTerminoValor =
        formValue.ticketFechaTermino && `${formValue.ticketFechaTermino}`.trim().length
          ? `${formValue.ticketFechaTermino}`.trim()
          : this.obtenerFechaActual();
      payload.fechaTermino = fechaTerminoValor;

      const detalle = formValue.ticketDetalleTermino
        ? formValue.ticketDetalleTermino.trim()
        : '';
      payload.detalleTermino =
        detalle.length > 0
          ? detalle
          : payload.descripcion && payload.descripcion.length >= 5
          ? payload.descripcion
          : 'Ticket cerrado por el técnico.';
    }

    return payload;
  }

  private obtenerIdsTecnicosSeleccionados(nombres: string[]): number[] {
    if (!Array.isArray(nombres) || nombres.length === 0) {
      return [];
    }

    const mapa = new Map<string, number>();
    this.tecnicosDisponibles.forEach((tecnico) => {
      const clave = (tecnico.name ?? '').trim().toLowerCase();
      if (clave) {
        mapa.set(clave, tecnico.id);
      }
    });

    const ids = nombres
      .map((nombre) => mapa.get(nombre.trim().toLowerCase()))
      .filter((id): id is number => typeof id === 'number' && Number.isInteger(id));

    return Array.from(new Set(ids));
  }

  private formatearAISO(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  private formatearParaInputFecha(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  private formatearParaInputSoloFecha(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private normalizarEstadoTicket(
    valor: unknown
  ): 'ingresado' | 'terminado' {
    if (typeof valor === 'string') {
      const normalizado = valor.trim().toLowerCase();
      if (normalizado === 'terminado') {
        return 'terminado';
      }
    }
    return 'ingresado';
  }

  private obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  }

  private habilitarTodosLosControles(): void {
    Object.keys(this.bitacoraForm.controls).forEach((control) => {
      this.bitacoraForm.get(control)?.enable({ emitEvent: false });
    });
  }

  eliminarBitacora(evento: Event, bitacora: Bitacora): void {
    evento.stopPropagation();
    if (!this.esAdmin || !bitacora?.id || this.eliminandoBitacoraId === bitacora.id) {
      return;
    }

    const confirmado = confirm('Confirma eliminar esta bitacora?');
    if (!confirmado) {
      return;
    }

    this.errorMensaje = '';
    this.exitoMensaje = '';
    this.eliminandoBitacoraId = bitacora.id;
    const debeRetroceder = this.bitacoras.length === 1 && this.paginaActual > 1;

    this.apiService
      .eliminarBitacora(bitacora.id)
      .pipe(finalize(() => (this.eliminandoBitacoraId = null)))
      .subscribe({
        next: () => {
          if (debeRetroceder) {
            this.paginaActual -= 1;
          }
          if (this.bitacoraSeleccionada?.id === bitacora.id) {
            this.bitacoraSeleccionada = undefined;
          }
          this.exitoMensaje = 'Bitacora eliminada correctamente.';
          this.cargarBitacoras(false);
        },
        error: (error) => {
          console.error('Error al eliminar bitacora', error);
          this.errorMensaje =
            error?.error?.error ??
            'No fue posible eliminar la bitacora. Intenta nuevamente.';
        },
      });
  }

  private refrescarBitacora(id: number): void {
    if (!id) {
      return;
    }
    this.apiService.bitacora(id).subscribe({
      next: (detalle) => {
        if (!detalle) {
          return;
        }

        this.detalleVisible = true;
        this.bitacoraSeleccionada = detalle;
        this.actualizarBitacoraEnListado(detalle);
      },
      error: (error) => {
        console.error('Error al refrescar bitacora', error);
      },
    });
  }

  private actualizarBitacoraEnListado(detalle: Bitacora): void {
    if (!detalle?.id) {
      return;
    }
    this.bitacoras = this.bitacoras.map((item) =>
      item.id === detalle.id ? { ...item, ...detalle } : item
    );
  }
}
