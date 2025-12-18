import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Ticket } from '../../interfaces/ticket.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
import { Proyecto } from '../../interfaces/proyecto.interface';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SignalService } from '../../services/signal.service';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { MODULES } from '../../config/modules';
import { TicketChatComponent } from '../../shared/ticket-chat/ticket-chat.component';
import { RichTextEditorComponent } from '../../shared/rich-text-editor/rich-text-editor.component';
import { TicketCardComponent } from './components/ticket-card/ticket-card.component';
import { TicketFiltersComponent } from './components/ticket-filters/ticket-filters.component';

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormatoFechaPipe,
    TicketChatComponent,
    RichTextEditorComponent,
    TicketCardComponent,
    TicketFiltersComponent,
  ],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.css',
})
export class TicketsComponent implements OnInit {
  filtroForm: FormGroup;
  ticketForm: FormGroup;

  tickets: Ticket[] = [];
  ticketSeleccionado?: Ticket;
  private ticketDestinoId: number | null = null;

  clientes: ClienteResumen[] = [];
  sucursalesFiltro: SucursalOption[] = [];
  sucursalesFormulario: SucursalOption[] = [];
  private sucursalesCache = new Map<string, SucursalOption[]>();
  tecnicosDisponibles: Tecnico[] = [];
  proyectos: Proyecto[] = [];
  tagsDisponibles: { id: number; nombre: string; color: string }[] = [];
  private clientesLeadMap = new Map<string, boolean>();

  paginaActual = 1;
  paginasTotales = 0;
  limite = 10;

  cargando = false;
  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';
  accesoDenegado = false;

  formularioVisible = false;
  modoEdicion = false;
  selectedIngresoFiles: File[] = [];
  selectedEvidenceFiles: File[] = [];
  eliminandoTicketId: number | null = null;
  tecnicosDropdownAbierto = false;
  detalleVisible = false;
  tecnicoActual: string[] = []; // Para mostrar quien era el tecnico original en el dropdown deshabilitado
  estadosTicketFormulario: { value: string; label: string }[] = [];
  mensajesNoLeidosPorTicket: Record<number, number> = {};
  usuarioActualId: number | null = null;

  readonly esAdmin: boolean;
  readonly esTecnico: boolean;
  readonly esMesaAyuda: boolean;
  readonly esComercial: boolean;
  readonly esCliente: boolean;
  readonly puedeCrear: boolean;
  readonly soloLectura: boolean;

  readonly estadosTicket = [
    { value: 'Nuevo', label: 'Nuevo' },
    { value: 'Abierto', label: 'Abierto' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En espera', label: 'En espera' },
    { value: 'Resuelto', label: 'Resuelto' },
    { value: 'Cerrado', label: 'Cerrado' },
  ] as const;
  readonly filtrosEstado = [
    { value: 'todos', label: 'Todos' },
    { value: 'Nuevo', label: 'Nuevos' },
    { value: 'Abierto', label: 'Abiertos' },
    { value: 'Pendiente', label: 'Pendientes' },
    { value: 'En espera', label: 'En espera' },
    { value: 'Resuelto', label: 'Resueltos' },
    { value: 'Cerrado', label: 'Cerrados' },
  ];

  readonly modules = MODULES;

  tituloModulo = 'Tickets';
  tieneAccesoTickets = true;

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
    this.soloLectura = this.esMesaAyuda || this.esComercial;

    // Inicializar usuarioActualId inmediatamente para que puedeEditarTicket funcione
    const tokenData = this.authService.decodificarToken();
    this.usuarioActualId = tokenData?.id ?? null;

    this.filtroForm = this.fb.group({
      clienteId: [''],
      sucursalId: [''],
      buscar: [''],
      estado: ['todos'],
      proyectoId: [''],
      tipo: [''],
      prioridad: [''],
      tecnicoId: [''],
      fecha: [''],
      tagIds: [[]],
    });

    this.ticketForm = this.fb.group({
      id: [null],
      titulo: [''],
      clienteId: ['', Validators.required],
      sucursalId: [''],
      fechaVisita: ['', Validators.required],
      horaLlegada: [''],
      horaSalida: [''],
      tecnicos: [[], Validators.required],
      ticketEstado: ['Nuevo', Validators.required],
      prioridad: ['Media', Validators.required],
      tipo: ['Incidente', Validators.required],
      ticketFechaTermino: [''],
      ticketDetalleTermino: [''],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      proyectoId: [null],
      comentarioInterno: [''],
      tiempoResolucionHoras: [null, [Validators.min(0), Validators.max(24)]],
      tiempoResolucionMinutos: [null, [Validators.min(0), Validators.max(59)]],
      tagIds: [[]],
    });
  }

  readonly prioridades = [
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
  ];

  readonly tiposTicket = [
    { value: 'Incidente', label: 'Incidente' },
    { value: 'Problema', label: 'Problema' },
    { value: 'Pregunta', label: 'Pregunta' },
    { value: 'Peticion', label: 'Petición' },
  ];

  ngOnInit(): void {
    this.signalService.updateData(this.tituloModulo);
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('ticketId');
      if (!idParam) {
        return;
      }
      const parsed = Number.parseInt(idParam, 10);
      if (!Number.isNaN(parsed)) {
        this.ticketDestinoId = parsed;
        // If tickets already loaded, process immediately
        if (this.tickets.length > 0 || !this.cargando) {
          this.procesarTicketDestino();
        }
      }
    });

    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        const rolTieneTickets =
          this.esAdmin || this.esTecnico || this.esComercial;
        const clienteTieneTickets = !!perfil?.haveTickets;
        this.tieneAccesoTickets = rolTieneTickets || clienteTieneTickets;
        this.accesoDenegado = this.esCliente && !clienteTieneTickets;
        if (!this.tieneAccesoTickets) {
          this.errorMensaje = 'Tu cuenta no tiene acceso al módulo de tickets.';
          this.tickets = [];
          return;
        }
        this.inicializarDatos();
      },
      error: () => {
        const rolTieneTickets =
          this.esAdmin || this.esTecnico || this.esComercial;
        this.tieneAccesoTickets = rolTieneTickets;
        this.accesoDenegado = this.esCliente && !rolTieneTickets;
        if (!this.tieneAccesoTickets) {
          this.errorMensaje =
            'No se pudo verificar el acceso a Tickets para esta cuenta.';
          this.tickets = [];
          return;
        }
        this.inicializarDatos();
      },
    });

    this.configurarValidacionesDinamicas();
  }

  private inicializarDatos(): void {
    this.errorMensaje = '';

    // Obtener ID del usuario actual
    const tokenData = this.authService.decodificarToken();
    this.usuarioActualId = tokenData?.id ?? null;

    // Establecer filtro por defecto según el rol
    if (this.esTecnico && this.usuarioActualId) {
      // Para técnicos: filtrar por su ID por defecto
      this.filtroForm.patchValue(
        { tecnicoId: this.usuarioActualId.toString() },
        { emitEvent: false }
      );
    }
    // Para admin: dejar vacío (todos)

    this.cargarClientes();
    this.cargarTecnicosDisponibles();
    this.cargarProyectos();
    this.cargarMensajesNoLeidos();
    this.estadosTicketFormulario = [...this.estadosTicket];
  }

  private configurarValidacionesDinamicas(): void {
    const estadoCtrl = this.ticketForm.get('ticketEstado');
    const fechaTerminoCtrl = this.ticketForm.get('ticketFechaTermino');
    const detalleTerminoCtrl = this.ticketForm.get('ticketDetalleTermino');
    const descripcionCtrl = this.ticketForm.get('descripcion');
    const tecnicosCtrl = this.ticketForm.get('tecnicos');

    if (
      !estadoCtrl ||
      !fechaTerminoCtrl ||
      !detalleTerminoCtrl ||
      !descripcionCtrl ||
      !tecnicosCtrl
    ) {
      return;
    }

    const aplicarValidaciones = () => {
      const estado = (estadoCtrl.value ?? 'Nuevo') as string;

      // Lógica para técnicos: Si el estado NO es "Nuevo", habilitar y requerir técnico
      if (estado === 'Nuevo') {
        // Si es Nuevo, deshabilitar el control de técnicos (no se puede asignar aún)
        tecnicosCtrl.disable({ emitEvent: false });
        tecnicosCtrl.clearValidators();
      } else {
        // Si no es Nuevo, habilitar y requerir selección de técnico
        tecnicosCtrl.enable({ emitEvent: false });
        tecnicosCtrl.setValidators([Validators.required]);
      }
      tecnicosCtrl.updateValueAndValidity({ emitEvent: false });

      if (estado === 'Resuelto' || estado === 'Cerrado') {
        if (!this.modules.bitacora) {
          fechaTerminoCtrl.setValue(this.obtenerFechaActual(), {
            emitEvent: false,
          });
        }
        fechaTerminoCtrl.setValidators([Validators.required]);
        detalleTerminoCtrl.setValidators([
          Validators.required,
          Validators.minLength(5),
        ]);
        descripcionCtrl.disable({ emitEvent: false });
      } else {
        fechaTerminoCtrl.setValue('', { emitEvent: false });
        fechaTerminoCtrl.clearValidators();
        detalleTerminoCtrl.setValue('', { emitEvent: false });
        detalleTerminoCtrl.clearValidators();
        descripcionCtrl.enable({ emitEvent: false });
        if (this.selectedEvidenceFiles.length) {
          this.selectedEvidenceFiles = [];
        }
      }
      fechaTerminoCtrl.updateValueAndValidity({ emitEvent: false });
      detalleTerminoCtrl.updateValueAndValidity({ emitEvent: false });
    };

    estadoCtrl.valueChanges.subscribe(() => aplicarValidaciones());
    aplicarValidaciones();
  }

  private cargarClientes(): void {
    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : [];
        this.actualizarMapaClientesLead(this.clientes);
        const clienteActual = this.filtroForm.value.clienteId;

        if (!clienteActual && this.clientes.length === 1) {
          const unico = this.clientes[0];
          this.filtroForm.patchValue(
            { clienteId: unico.id },
            { emitEvent: false }
          );
          this.cargarSucursalesParaCliente(unico.id, 'filtro');
        } else if (clienteActual) {
          this.cargarSucursalesParaCliente(clienteActual, 'filtro');
        }

        this.cargarTickets();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.errorMensaje =
          error?.error?.error ??
          'No fue posible obtener el listado de clientes disponibles.';
        this.clientesLeadMap.clear();
        this.cargarTickets();
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
    this.apiService.getProyectos({ pagina: 1, limite: 100 }).subscribe({
      next: (respuesta) => {
        this.proyectos = Array.isArray(respuesta?.data) ? respuesta.data : [];
      },
      error: () => {
        this.proyectos = [];
      },
    });
  }

  private cargarMensajesNoLeidos(): void {
    this.apiService.getMensajesNoLeidosPorTicket().subscribe({
      next: (respuesta) => {
        this.mensajesNoLeidosPorTicket = respuesta?.data || {};
      },
      error: () => {
        this.mensajesNoLeidosPorTicket = {};
      },
    });
  }

  getMensajesNoLeidos(ticketId: number): number {
    return this.mensajesNoLeidosPorTicket[ticketId] || 0;
  }

  buscarTickets(): void {
    this.paginaActual = 1;
    this.cargarTickets();
  }

  limpiarFiltros(): void {
    // Para técnicos: mantener su ID como filtro por defecto
    const tecnicoIdDefault =
      this.esTecnico && this.usuarioActualId
        ? this.usuarioActualId.toString()
        : '';

    this.filtroForm.reset({
      clienteId:
        this.esCliente && this.clientes.length === 1 ? this.clientes[0].id : '',
      sucursalId: '',
      buscar: '',
      estado: 'todos',
      proyectoId: '',
      tipo: '',
      prioridad: '',
      tecnicoId: tecnicoIdDefault,
      fecha: '',
    });
    const clienteId = this.filtroForm.value.clienteId;
    if (clienteId) {
      this.cargarSucursalesParaCliente(clienteId, 'filtro');
    } else {
      this.sucursalesFiltro = [];
    }
    this.paginaActual = 1;
    this.cargarTickets();
  }

  private cargarTickets(mostrarLoader: boolean = true): void {
    if (!this.tieneAccesoTickets) {
      return;
    }

    if (mostrarLoader) {
      this.cargando = true;
    }
    this.errorMensaje = '';

    const filtros = this.filtroForm.getRawValue();
    const params: Record<string, any> = {
      pagina: this.paginaActual,
      limite: this.limite,
      clienteId: filtros.clienteId,
      sucursalId: filtros.sucursalId,
      buscar: filtros.buscar,
    };
    if (filtros.estado && filtros.estado !== 'todos') {
      params['estado'] = filtros.estado;
    }
    if (filtros.proyectoId) {
      if (filtros.proyectoId === 'sin-proyecto') {
        params['sinProyecto'] = 'true';
      } else {
        params['proyectoId'] = filtros.proyectoId;
      }
    }
    if (filtros.tipo) params['tipo'] = filtros.tipo;
    if (filtros.prioridad) params['prioridad'] = filtros.prioridad;
    if (filtros.tecnicoId) {
      if (filtros.tecnicoId === 'sinAsignar') {
        params['sinAsignar'] = 'true';
      } else {
        params['tecnicoId'] = filtros.tecnicoId;
      }
    }
    if (filtros.fecha) params['fecha'] = filtros.fecha;
    if (filtros.tagIds?.length) {
      params['tagIds'] = filtros.tagIds.join(',');
    }

    this.apiService
      .tickets(params)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          const data = respuesta?.data ?? [];
          this.tickets = data;
          this.paginasTotales = respuesta?.paginasTotales ?? 0;
          this.paginaActual = respuesta?.pagina ?? 1;
          if (this.ticketSeleccionado) {
            const actualizada = data.find(
              (item: Ticket) => item.id === this.ticketSeleccionado?.id
            );
            this.ticketSeleccionado = actualizada;
          }
          this.procesarTicketDestino();
        },
        error: (error) => {
          console.error('Error al cargar tickets', error);
          this.errorMensaje =
            error?.error?.error ??
            'Ocurrio un error al intentar obtener los tickets.';
          this.tickets = [];
          this.paginasTotales = 0;
        },
      });
  }

  cambiarPagina(pagina: number): void {
    if (
      pagina < 1 ||
      pagina > this.paginasTotales ||
      pagina === this.paginaActual
    ) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarTickets();
  }

  private procesarTicketDestino(): void {
    if (!this.ticketDestinoId) {
      return;
    }
    const objetivo = this.tickets.find(
      (item: Ticket) => item.id === this.ticketDestinoId
    );
    if (objetivo) {
      // Found in current list, show detail
      this.ticketSeleccionado = objetivo;
      this.detalleVisible = true;
      this.limpiarTicketDestinoId();
    } else {
      // Not in current list, fetch from API
      this.apiService.ticket(this.ticketDestinoId).subscribe({
        next: (ticket) => {
          if (ticket) {
            this.ticketSeleccionado = ticket;
            this.detalleVisible = true;
          }
          this.limpiarTicketDestinoId();
        },
        error: () => {
          this.limpiarTicketDestinoId();
        },
      });
    }
  }

  private limpiarTicketDestinoId(): void {
    this.ticketDestinoId = null;
    this.router.navigate([], {
      queryParams: { ticketId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  seleccionarTicket(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.detalleVisible = true;
    // Limpiar el badge de mensajes no leídos para este ticket
    if (this.mensajesNoLeidosPorTicket[ticket.id]) {
      delete this.mensajesNoLeidosPorTicket[ticket.id];
    }
  }

  cerrarDetalle(): void {
    this.detalleVisible = false;
    this.ticketSeleccionado = undefined;
  }

  puedeEditarTicket(ticket: Ticket): boolean {
    // Admin siempre puede editar
    if (this.esAdmin) {
      return true;
    }

    // Técnico: verificar permisos específicos
    if (this.esTecnico && this.usuarioActualId) {
      // Tickets nuevos (sin asignar) pueden ser editados por cualquier técnico
      if (ticket.estadoTicket === 'Nuevo' || !ticket.tecnicoAsignadoId) {
        return true;
      }

      // Técnico asignado actualmente
      if (ticket.tecnicoAsignadoId === this.usuarioActualId) {
        return true;
      }

      // Verificar historial de transferencias
      const historial = ticket.historialTransferencias ?? [];
      if (Array.isArray(historial)) {
        for (const transferencia of historial) {
          if (
            transferencia.fromId === this.usuarioActualId ||
            transferencia.toId === this.usuarioActualId
          ) {
            return true;
          }
        }
      }

      return false;
    }

    return false;
  }

  abrirFormularioCrear(): void {
    if (!this.puedeCrear || !this.tieneAccesoTickets) {
      return;
    }

    this.detalleVisible = false;
    this.ticketSeleccionado = undefined;
    this.habilitarTodosLosControles();
    const clienteId =
      this.filtroForm.value.clienteId ||
      (this.clientes.length === 1 ? this.clientes[0].id : '');

    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.ticketForm.reset({
      id: null,
      titulo: '',
      clienteId,
      sucursalId: '',
      fechaVisita: this.obtenerFechaActual(),
      horaLlegada: '',
      horaSalida: '',
      tecnicos: [], // En Nuevo no se asigna tecnico
      ticketEstado: 'Nuevo',
      prioridad: 'Media',
      tipo: 'Incidente',
      ticketFechaTermino: '',
      ticketDetalleTermino: '',
      descripcion: '',
      proyectoId: null,
      comentarioInterno: '',
      tiempoResolucionHoras: null,
      tiempoResolucionMinutos: null,
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
    // Deshabilitar tecnicos al crear, ya que estado es Nuevo
    this.ticketForm.get('tecnicos')?.disable({ emitEvent: false });
    this.estadosTicketFormulario = [...this.estadosTicket];
  }

  abrirFormularioEditar(ticket: Ticket, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeEditarTicket(ticket)) {
      return;
    }

    this.detalleVisible = false;
    this.habilitarTodosLosControles();
    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.ticketForm.reset({
      id: ticket.id,
      titulo: ticket.titulo ?? '',
      clienteId: ticket.casaMatrizId,
      sucursalId: ticket.sucursalId ?? '',
      fechaVisita: ticket.fechaVisita?.slice(0, 10) ?? '',
      horaLlegada: this.formatearParaInputFecha(ticket.horaLlegada),
      horaSalida: this.formatearParaInputFecha(ticket.horaSalida),
      tecnicos: Array.isArray(ticket.tecnicos) ? [...ticket.tecnicos] : [],
      ticketEstado: ticket.estadoTicket ?? 'Nuevo',
      prioridad: ticket.prioridad ?? 'Media',
      tipo: ticket.tipo ?? 'Incidente',
      ticketFechaTermino: this.formatearParaInputSoloFecha(ticket.fechaTermino),
      ticketDetalleTermino: ticket.detalleTermino ?? '',
      descripcion: ticket.descripcion,
      proyectoId: ticket.proyectoId ?? null,
      comentarioInterno: ticket.comentarioInterno ?? '',
      tiempoResolucionHoras: ticket.tiempoResolucion
        ? Math.floor(ticket.tiempoResolucion)
        : null,
      tiempoResolucionMinutos: ticket.tiempoResolucion
        ? Math.round(
            (ticket.tiempoResolucion - Math.floor(ticket.tiempoResolucion)) * 60
          )
        : null,
      tagIds: Array.isArray(ticket.tags) ? ticket.tags.map((t) => t.id) : [],
    });

    this.formularioVisible = true;
    this.modoEdicion = true;
    this.exitoMensaje = '';
    this.errorMensaje = '';

    const clienteId = ticket.casaMatrizId;
    this.cargarSucursalesParaCliente(clienteId, 'form', () => {
      this.ticketForm.patchValue({
        sucursalId: ticket.sucursalId ?? '',
      });
    });
    this.cargarTagsCliente(clienteId);

    // Logica de visualizacion de tecnicos
    this.tecnicoActual = Array.isArray(ticket.tecnicos)
      ? [...ticket.tecnicos]
      : [];

    const estado = ticket.estadoTicket ?? 'Nuevo';
    if (estado === 'Nuevo') {
      // Si es Nuevo, permitir asignar técnico (primera asignación)
      // El técnico se puede asignar junto con el cambio de estado
      this.tecnicoActual = []; // Limpiar para mostrar dropdown de selección
      this.ticketForm.get('tecnicos')?.enable({ emitEvent: false });
      // Mantener todos los estados disponibles para tickets nuevos
      this.estadosTicketFormulario = [...this.estadosTicket];
    } else {
      // Si no es Nuevo (Abierto, etc), DEBE haber un tecnico asignado.
      // Permitimos editar (Transferir) directamente mediante el segundo dropdown.
      this.ticketForm.get('tecnicos')?.enable({ emitEvent: false });

      // Filtrar estados: Si ya no es Nuevo, no puede volver a ser Nuevo.
      this.estadosTicketFormulario = this.estadosTicket.filter(
        (e) => e.value !== 'Nuevo'
      );
    }

    // Validar permisos de edicion para tecnico asignado
    if (!this.esAdmin && this.esTecnico) {
      const usuario = this.authService.decodificarToken();
      if (
        ticket.tecnicoAsignadoId &&
        usuario?.id !== ticket.tecnicoAsignadoId
      ) {
        this.ticketForm.disable({ emitEvent: false });
        this.exitoMensaje =
          'No tienes permisos para editar este ticket (asignado a otro técnico).';
      }
    }
  }

  cerrarFormulario(): void {
    this.formularioVisible = false;
    this.modoEdicion = false;
    this.guardando = false;
    this.ticketForm.reset({
      tecnicos: [],
      ticketEstado: 'Nuevo',
      ticketFechaTermino: '',
      ticketDetalleTermino: '',
      proyectoId: null,
      comentarioInterno: '',
      tiempoResolucionHoras: null,
      tiempoResolucionMinutos: null,
    });
    this.estadosTicketFormulario = [...this.estadosTicket];
    this.sucursalesFormulario = [];
    this.selectedIngresoFiles = [];
    this.selectedEvidenceFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.habilitarTodosLosControles();
  }

  get tecnicosSeleccionados(): string[] {
    const value = this.ticketForm.get('tecnicos')?.value;
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

  get estadoTicketSeleccionado(): string {
    const control = this.ticketForm.get('ticketEstado');
    return control?.value ?? 'Nuevo';
  }

  get mostrarCamposTerminoTicket(): boolean {
    return (
      this.estadoTicketSeleccionado === 'Resuelto' ||
      this.estadoTicketSeleccionado === 'Cerrado'
    );
  }

  get mostrarCamposHorarios(): boolean {
    return (
      this.modules.bitacora &&
      (this.estadoTicketSeleccionado === 'Resuelto' ||
        this.estadoTicketSeleccionado === 'Cerrado')
    );
  }

  toggleTecnicosDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.tecnicosDropdownAbierto = !this.tecnicosDropdownAbierto;
  }

  onToggleTecnico(tecnico: Tecnico, event?: MouseEvent): void {
    event?.stopPropagation();
    const actuales = this.tecnicosSeleccionados;
    const estaSeleccionado = actuales.includes(tecnico.name);

    // Logica de seleccion unica (Radio behavior)
    if (estaSeleccionado) {
      // Si ya esta seleccionado, permitimos deseleccionar?
      // Generalmente si, para dejar vacio.
      this.ticketForm.get('tecnicos')?.setValue([]);
    } else {
      // Si no esta seleccionado, reemplazamos cualquier seleccion previa
      this.ticketForm.get('tecnicos')?.setValue([tecnico.name]);
    }

    this.ticketForm.get('tecnicos')?.markAsDirty();
    this.ticketForm.get('tecnicos')?.markAsTouched();
    this.tecnicosDropdownAbierto = false; // Cerrar al seleccionar para UX mas rapida? O mantener abierto? Mantener abierto es mejor si fuera multi. Single -> Cerrar.
  }

  estaTecnicoSeleccionado(tecnico: Tecnico): boolean {
    return this.tecnicosSeleccionados.includes(tecnico.name);
  }

  getNombreTecnico(id: number): string {
    const found = this.tecnicosDisponibles.find((t) => t.id === id);
    return found ? found.name : `ID: ${id}`;
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    if (this.tecnicosDropdownAbierto) {
      this.tecnicosDropdownAbierto = false;
    }
  }

  guardarTicket(): void {
    if (this.guardando || !this.tieneAccesoTickets) {
      return;
    }

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const formValue = this.ticketForm.getRawValue();
    const payload = this.construirPayloadCompleto(formValue);
    if (!payload) {
      this.errorMensaje =
        'Debes asignar un técnico responsable antes de cambiar el estado del ticket.';
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    const esEdicion = this.modoEdicion && formValue.id;
    let solicitud$;

    if (this.selectedIngresoFiles.length || this.selectedEvidenceFiles.length) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      this.selectedIngresoFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });
      this.selectedEvidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file, file.name);
      });
      solicitud$ = esEdicion
        ? this.apiService.actualizarTicket(formValue.id, formData)
        : this.apiService.crearTicket(formData);
    } else {
      solicitud$ = esEdicion
        ? this.apiService.actualizarTicket(formValue.id, payload)
        : this.apiService.crearTicket(payload);
    }

    solicitud$.pipe(finalize(() => (this.guardando = false))).subscribe({
      next: (respuesta) => {
        this.exitoMensaje = esEdicion
          ? 'Ticket actualizado correctamente.'
          : 'Ticket registrado correctamente.';
        this.cerrarFormulario();
        if (esEdicion) {
          this.cargarTickets(false);
          this.refrescarTicket(formValue.id);
        } else {
          this.paginaActual = 1;
          this.cargarTickets();
          if (respuesta?.id) {
            this.refrescarTicket(respuesta.id);
          }
        }
      },
      error: (error) => {
        console.error('Error al guardar ticket', error);
        this.errorMensaje =
          error?.error?.error ?? 'No se pudo guardar el ticket.';
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
      tipo === 'evidencia'
        ? this.selectedEvidenceFiles
        : this.selectedIngresoFiles;
    files.forEach((file) => destino.push(file));
    if (input) {
      input.value = '';
    }
  }

  removeSelectedFile(index: number, tipo: 'ingreso' | 'evidencia'): void {
    const destino =
      tipo === 'evidencia'
        ? this.selectedEvidenceFiles
        : this.selectedIngresoFiles;
    if (index >= 0 && index < destino.length) {
      destino.splice(index, 1);
    }
  }

  onClienteFiltroChange(clienteId: string): void {
    this.filtroForm.patchValue(
      { sucursalId: '', tagIds: [] },
      { emitEvent: false }
    );
    if (!clienteId) {
      this.sucursalesFiltro = [];
      this.tagsDisponibles = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'filtro');
    this.cargarTagsCliente(clienteId);
  }

  onClienteFormChange(clienteId: string): void {
    this.ticketForm.patchValue({ sucursalId: '', tagIds: [] });
    if (!clienteId) {
      this.sucursalesFormulario = [];
      this.tagsDisponibles = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'form');
    this.cargarTagsCliente(clienteId);
  }

  private cargarTagsCliente(clienteId: string): void {
    if (!clienteId) {
      this.tagsDisponibles = [];
      return;
    }
    this.apiService.getTagsCliente(clienteId).subscribe({
      next: (tags) => {
        this.tagsDisponibles = Array.isArray(tags) ? tags : [];
      },
      error: () => {
        this.tagsDisponibles = [];
      },
    });
  }

  // ====== Métodos para Tags en Filtro ======
  isTagSelected(tagId: number): boolean {
    const tagIds = this.filtroForm.get('tagIds')?.value || [];
    return tagIds.includes(tagId);
  }

  toggleTagFilter(tagId: number): void {
    const tagIds = [...(this.filtroForm.get('tagIds')?.value || [])];
    const index = tagIds.indexOf(tagId);
    if (index >= 0) {
      tagIds.splice(index, 1);
    } else {
      tagIds.push(tagId);
    }
    this.filtroForm.get('tagIds')?.setValue(tagIds);
  }

  // ====== Métodos para Tags en Formulario ======
  isTagSelectedInForm(tagId: number): boolean {
    const tagIds = this.ticketForm.get('tagIds')?.value || [];
    return tagIds.includes(tagId);
  }

  toggleTagInForm(tagId: number): void {
    const tagIds = [...(this.ticketForm.get('tagIds')?.value || [])];
    const index = tagIds.indexOf(tagId);
    if (index >= 0) {
      tagIds.splice(index, 1);
    } else {
      tagIds.push(tagId);
    }
    this.ticketForm.get('tagIds')?.setValue(tagIds);
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

  esTicketLead(ticket?: Ticket | null): boolean {
    if (!ticket) {
      return false;
    }
    if (ticket.casaMatriz?.esLead !== undefined) {
      return !!ticket.casaMatriz.esLead;
    }
    return !!this.clientesLeadMap.get(ticket.casaMatrizId);
  }

  private construirPayloadCompleto(formValue: any): any | null {
    const tecnicosEntrada = Array.isArray(formValue.tecnicos)
      ? formValue.tecnicos
      : [];
    const tecnicos = tecnicosEntrada
      .map((item: string) => `${item}`.trim())
      .filter((item: string) => item.length > 0);

    const estadoTicket = this.normalizarEstadoTicket(formValue.ticketEstado);

    // Si el estado NO es "Nuevo", se requiere al menos un técnico
    if (estadoTicket !== 'Nuevo' && tecnicos.length === 0) {
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

    const payload: any = {
      casaMatrizId: formValue.clienteId,
      sucursalId: formValue.sucursalId || null,
      fechaVisita: formValue.fechaVisita,
      horaLlegada: this.formatearAISO(formValue.horaLlegada),
      horaSalida: this.formatearAISO(formValue.horaSalida),
      tecnicos,
      descripcion: formValue.descripcion.trim(),
      titulo: formValue.titulo ? formValue.titulo.trim() : null,
      isEmergencia: false,
      estadoTicket,
      prioridad: formValue.prioridad,
      tipo: formValue.tipo,
      proyectoId,
      fechaTermino: null,
      detalleTermino: null,
    };
    payload.tecnicosIds = this.obtenerIdsTecnicosSeleccionados(tecnicos);

    if (estadoTicket === 'Resuelto' || estadoTicket === 'Cerrado') {
      const fechaTerminoValor =
        formValue.ticketFechaTermino &&
        `${formValue.ticketFechaTermino}`.trim().length
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

    // Comentario Interno y Tiempo Resolucion
    if (
      formValue.comentarioInterno &&
      `${formValue.comentarioInterno}`.trim()
    ) {
      payload.comentarioInterno = `${formValue.comentarioInterno}`.trim();
    }

    const horas = formValue.tiempoResolucionHoras
      ? Number(formValue.tiempoResolucionHoras)
      : 0;
    const minutos = formValue.tiempoResolucionMinutos
      ? Number(formValue.tiempoResolucionMinutos)
      : 0;
    if (
      (horas > 0 || minutos > 0) &&
      !Number.isNaN(horas) &&
      !Number.isNaN(minutos)
    ) {
      payload.tiempoResolucion = horas + minutos / 60;
    }

    // Tags
    if (Array.isArray(formValue.tagIds) && formValue.tagIds.length > 0) {
      payload.tagIds = formValue.tagIds;
    }

    return payload;
  }

  private normalizarEstadoTicket(valor: unknown): string {
    if (typeof valor === 'string') {
      const normalizado = valor.trim();
      // Mapeo legacy
      if (normalizado.toLowerCase() === 'ingresado') return 'Nuevo';
      if (normalizado.toLowerCase() === 'terminado') return 'Cerrado';
      return normalizado;
    }
    return 'Nuevo';
  }

  obtenerClaseEstado(estado: string): string {
    if (!estado) return '';
    const normalized = estado.toLowerCase().replace(/\s+/g, '-');
    return `ticket-state-${normalized}`;
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
      .filter(
        (id): id is number => typeof id === 'number' && Number.isInteger(id)
      );

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

  private formatearParaInputSoloFecha(
    value: string | null | undefined
  ): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  }

  private habilitarTodosLosControles(): void {
    Object.keys(this.ticketForm.controls).forEach((control) => {
      this.ticketForm.get(control)?.enable({ emitEvent: false });
    });
  }

  eliminarTicket(evento: Event, ticket: Ticket): void {
    evento.stopPropagation();
    if (!this.esAdmin || !ticket?.id || this.eliminandoTicketId === ticket.id) {
      return;
    }

    const confirmado = confirm('Confirma eliminar este ticket?');
    if (!confirmado) {
      return;
    }

    this.errorMensaje = '';
    this.exitoMensaje = '';
    this.eliminandoTicketId = ticket.id;
    const debeRetroceder = this.tickets.length === 1 && this.paginaActual > 1;

    this.apiService
      .eliminarTicket(ticket.id)
      .pipe(finalize(() => (this.eliminandoTicketId = null)))
      .subscribe({
        next: () => {
          if (debeRetroceder) {
            this.paginaActual -= 1;
          }
          if (this.ticketSeleccionado?.id === ticket.id) {
            this.ticketSeleccionado = undefined;
          }
          this.exitoMensaje = 'Ticket eliminado correctamente.';
          this.cargarTickets(false);
        },
        error: (error) => {
          console.error('Error al eliminar ticket', error);
          this.errorMensaje =
            error?.error?.error ??
            'No fue posible eliminar el ticket. Intenta nuevamente.';
        },
      });
  }

  private refrescarTicket(id: number): void {
    if (!id) {
      return;
    }
    this.apiService.ticket(id).subscribe({
      next: (detalle) => {
        if (!detalle) {
          return;
        }

        this.detalleVisible = true;
        this.ticketSeleccionado = detalle;
        this.actualizarTicketEnListado(detalle);
      },
      error: (error) => {
        console.error('Error al refrescar ticket', error);
      },
    });
  }

  private actualizarTicketEnListado(detalle: Ticket): void {
    if (!detalle?.id) {
      return;
    }
    this.tickets = this.tickets.map((item) =>
      item.id === detalle.id ? { ...item, ...detalle } : item
    );
  }

  private actualizarMapaClientesLead(clientes: ClienteResumen[]): void {
    this.clientesLeadMap.clear();
    clientes.forEach((cliente) => {
      if (!cliente?.id) {
        return;
      }
      this.clientesLeadMap.set(cliente.id, !!cliente.esLead);
    });
  }

  downloadAdjunto(fileName: string): void {
    if (!fileName) {
      console.error('Nombre de archivo no proporcionado');
      return;
    }

    this.apiService.signedUrl(fileName).subscribe({
      next: (url) => {
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.split('/').pop() || fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          console.error('URL firmada no disponible');
          this.errorMensaje =
            'No se pudo descargar el archivo. URL no disponible.';
        }
      },
      error: (err) => {
        console.error('Error al obtener URL firmada:', err);
        this.errorMensaje =
          'Error al descargar el archivo. Por favor, intenta nuevamente.';
      },
    });
  }

  /**
   * Calcula el tiempo transcurrido desde una fecha hasta ahora
   * y lo devuelve en formato legible (Hace X días, horas, etc.)
   */
  calcularTiempoTranscurrido(fecha: string | Date | undefined): string {
    if (!fecha) {
      return '';
    }

    const fechaTicket = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaTicket.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffSemanas = Math.floor(diffDias / 7);
    const diffMeses = Math.floor(diffDias / 30);

    if (diffMins < 1) {
      return 'Hace un momento';
    }
    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    }
    if (diffHoras < 24) {
      return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    }
    if (diffDias === 1) {
      return 'Hace 1 día';
    }
    if (diffDias < 7) {
      return `Hace ${diffDias} días`;
    }
    if (diffSemanas === 1) {
      return 'Hace 1 semana';
    }
    if (diffSemanas < 4) {
      return `Hace ${diffSemanas} semanas`;
    }
    if (diffMeses === 1) {
      return 'Hace 1 mes';
    }
    return `Hace ${diffMeses} meses`;
  }

  /**
   * Formatea el ID del ticket con ceros a la izquierda (8 dígitos)
   */
  formatTicketId(id: number): string {
    return id.toString().padStart(8, '0');
  }
}
