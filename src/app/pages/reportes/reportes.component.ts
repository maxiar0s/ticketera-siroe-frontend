import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { SignalService } from '../../services/signal.service';
import * as XLSX from 'xlsx';

interface TicketSLA {
  id: number;
  titulo: string;
  descripcion: string;
  estadoTicket: string;
  prioridad: string;
  tipo: string;
  createdAt: string;
  fechaTermino: string | null;
  fechaRespuesta: string | null;
  tiempoResolucion: number | null;
  casaMatriz?: { id: string; razonSocial: string };
  sucursal?: { id: string; nombre: string };
  tecnicoAsignado?: { id: number; name: string };
  creadoPor?: { id: number; name: string };
  historialTransferencias: any[];
  historialEstados: any[];
  // Calculated fields
  tiempoRespuestaHoras?: number;
  tiempoResolucionHoras?: number;
  slaStatus?: 'excelente' | 'bueno' | 'advertencia' | 'critico';
  progreso?: number;
}

interface ClienteResumen {
  id: string;
  razonSocial: string;
}

interface Tecnico {
  id: number;
  name: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
})
export class ReportesComponent implements OnInit {
  // Tab control
  tabActiva: 'logs' | 'tickets' = 'tickets';

  // Logs data (existing)
  logs: any[] = [];
  filteredLogs: any[] = [];
  filtroUsuario: string = '';
  filtroAccion: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Tickets SLA data
  tickets: TicketSLA[] = [];
  filteredTickets: TicketSLA[] = [];
  clientes: ClienteResumen[] = [];
  tecnicos: Tecnico[] = [];

  // Ticket filters
  filtroMes: string = '';
  filtroAnio: number = new Date().getFullYear();
  filtroCliente: string = '';
  filtroStatus: string = '';
  filtroTecnico: string = '';

  // Summary stats
  totalTickets: number = 0;
  ticketsCerrados: number = 0;
  ticketsEnCurso: number = 0;
  promedioSLA: number = 0;

  // Available months
  meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Available years
  anios: number[] = [];

  // Available statuses
  estados = ['Nuevo', 'En Proceso', 'Cerrado'];

  // Selection
  selectedTickets: Set<number> = new Set();
  selectAll: boolean = false;

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService,
    private signalService: SignalService
  ) {
    // Generate years from 2020 to current year + 1
    const currentYear = new Date().getFullYear();
    for (let y = 2020; y <= currentYear + 1; y++) {
      this.anios.push(y);
    }
  }

  ngOnInit(): void {
    this.signalService.updateData('Reportes');
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.loaderService.showSection();

    // Load clients for filter dropdown
    this.apiService.clientesResumen().subscribe({
      next: (data) => {
        this.clientes = data || [];
      },
      error: (err) => console.error('Error al cargar clientes', err),
    });

    // Load technicians for filter dropdown
    this.apiService.tecnicosDisponibles().subscribe({
      next: (data) => {
        this.tecnicos = data || [];
      },
      error: (err) => console.error('Error al cargar técnicos', err),
    });

    // Load tickets
    this.cargarTickets();

    // Load logs
    this.cargarLogs();
  }

  cargarLogs() {
    this.apiService.getLogs().subscribe({
      next: (response) => {
        // API returns { data: [], total, pagina, paginasTotales }
        this.logs = response?.data || response || [];
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error al cargar logs', err);
        this.logs = [];
      },
    });
  }

  cargarTickets() {
    this.loaderService.showSection();

    // Load all tickets without pagination for reporting
    this.apiService.tickets({ limite: 1000 }).subscribe({
      next: (response) => {
        const data = response?.data || response || [];
        this.tickets = data.map((t: any) => this.procesarTicketSLA(t));
        this.aplicarFiltrosTickets();
        this.loaderService.hideSection();
      },
      error: (err) => {
        console.error('Error al cargar tickets', err);
        this.loaderService.hideSection();
      },
    });
  }

  procesarTicketSLA(ticket: any): TicketSLA {
    const createdAt = new Date(ticket.createdAt);
    let tiempoRespuestaHoras: number | undefined;
    let tiempoResolucionHoras: number | undefined;
    let slaStatus: 'excelente' | 'bueno' | 'advertencia' | 'critico' =
      'excelente';
    let progreso = 0;

    // Calculate response time
    if (ticket.fechaRespuesta) {
      const fechaRespuesta = new Date(ticket.fechaRespuesta);
      tiempoRespuestaHoras =
        (fechaRespuesta.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    }

    // Calculate resolution time
    if (ticket.fechaTermino) {
      const fechaTermino = new Date(ticket.fechaTermino);
      tiempoResolucionHoras =
        (fechaTermino.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    } else if (ticket.tiempoResolucion) {
      tiempoResolucionHoras = ticket.tiempoResolucion;
    }

    // Determine SLA status based on resolution time
    if (ticket.estadoTicket === 'Cerrado') {
      progreso = 100;
      if (tiempoResolucionHoras !== undefined) {
        if (tiempoResolucionHoras <= 24) {
          slaStatus = 'excelente';
        } else if (tiempoResolucionHoras <= 48) {
          slaStatus = 'bueno';
        } else if (tiempoResolucionHoras <= 72) {
          slaStatus = 'advertencia';
        } else {
          slaStatus = 'critico';
        }
      }
    } else if (ticket.estadoTicket === 'En Proceso') {
      // Calculate progress based on time open (max 100%)
      const now = new Date();
      const hoursOpen =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      // Assume target SLA is 48 hours
      progreso = Math.min(Math.round((hoursOpen / 48) * 100), 100);

      if (hoursOpen <= 24) {
        slaStatus = 'excelente';
      } else if (hoursOpen <= 48) {
        slaStatus = 'bueno';
      } else if (hoursOpen <= 72) {
        slaStatus = 'advertencia';
      } else {
        slaStatus = 'critico';
      }
    } else {
      // Nuevo - calculate time since creation
      const now = new Date();
      const hoursOpen =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      progreso = 0;

      if (hoursOpen <= 4) {
        slaStatus = 'excelente';
      } else if (hoursOpen <= 12) {
        slaStatus = 'bueno';
      } else if (hoursOpen <= 24) {
        slaStatus = 'advertencia';
      } else {
        slaStatus = 'critico';
      }
    }

    return {
      ...ticket,
      tiempoRespuestaHoras,
      tiempoResolucionHoras,
      slaStatus,
      progreso,
    };
  }

  aplicarFiltros() {
    this.filteredLogs = this.logs.filter((log) => {
      const matchUsuario = this.filtroUsuario
        ? log.usuario?.name
            .toLowerCase()
            .includes(this.filtroUsuario.toLowerCase()) ||
          log.usuario?.email
            .toLowerCase()
            .includes(this.filtroUsuario.toLowerCase())
        : true;
      const matchAccion = this.filtroAccion
        ? log.accion.toLowerCase().includes(this.filtroAccion.toLowerCase())
        : true;

      let matchFecha = true;
      const fechaLog = new Date(log.fecha);
      if (this.filtroFechaInicio) {
        matchFecha = matchFecha && fechaLog >= new Date(this.filtroFechaInicio);
      }
      if (this.filtroFechaFin) {
        const fin = new Date(this.filtroFechaFin);
        fin.setHours(23, 59, 59, 999);
        matchFecha = matchFecha && fechaLog <= fin;
      }

      return matchUsuario && matchAccion && matchFecha;
    });
  }

  aplicarFiltrosTickets() {
    this.filteredTickets = this.tickets.filter((ticket) => {
      // Month filter
      if (this.filtroMes) {
        const ticketDate = new Date(ticket.createdAt);
        const ticketMonth = String(ticketDate.getMonth() + 1).padStart(2, '0');
        const ticketYear = ticketDate.getFullYear();
        if (ticketMonth !== this.filtroMes || ticketYear !== this.filtroAnio) {
          return false;
        }
      }

      // Client filter
      if (this.filtroCliente && ticket.casaMatriz?.id !== this.filtroCliente) {
        return false;
      }

      // Status filter
      if (this.filtroStatus && ticket.estadoTicket !== this.filtroStatus) {
        return false;
      }

      // Technician filter
      if (
        this.filtroTecnico &&
        ticket.tecnicoAsignado?.id !== parseInt(this.filtroTecnico)
      ) {
        return false;
      }

      return true;
    });

    this.calcularEstadisticas();
    this.selectedTickets.clear();
    this.selectAll = false;
  }

  calcularEstadisticas() {
    this.totalTickets = this.filteredTickets.length;
    this.ticketsCerrados = this.filteredTickets.filter(
      (t) => t.estadoTicket === 'Cerrado'
    ).length;
    this.ticketsEnCurso = this.filteredTickets.filter(
      (t) => t.estadoTicket === 'En Proceso'
    ).length;

    // Calculate average SLA for closed tickets
    const ticketsCerradosConSLA = this.filteredTickets.filter(
      (t) =>
        t.estadoTicket === 'Cerrado' && t.tiempoResolucionHoras !== undefined
    );

    if (ticketsCerradosConSLA.length > 0) {
      const totalHoras = ticketsCerradosConSLA.reduce(
        (sum, t) => sum + (t.tiempoResolucionHoras || 0),
        0
      );
      this.promedioSLA = Math.round(totalHoras / ticketsCerradosConSLA.length);
    } else {
      this.promedioSLA = 0;
    }
  }

  limpiarFiltros() {
    this.filtroUsuario = '';
    this.filtroAccion = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  limpiarFiltrosTickets() {
    this.filtroMes = '';
    this.filtroAnio = new Date().getFullYear();
    this.filtroCliente = '';
    this.filtroStatus = '';
    this.filtroTecnico = '';
    this.aplicarFiltrosTickets();
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.filteredTickets.forEach((t) => this.selectedTickets.add(t.id));
    } else {
      this.selectedTickets.clear();
    }
  }

  toggleTicketSelection(ticketId: number) {
    if (this.selectedTickets.has(ticketId)) {
      this.selectedTickets.delete(ticketId);
    } else {
      this.selectedTickets.add(ticketId);
    }
    this.selectAll =
      this.selectedTickets.size === this.filteredTickets.length &&
      this.filteredTickets.length > 0;
  }

  isTicketSelected(ticketId: number): boolean {
    return this.selectedTickets.has(ticketId);
  }

  descargarExcel() {
    const dataToExport = this.filteredTickets.map((t, idx) => ({
      '#': idx + 1,
      Ticket: t.titulo || `Ticket #${t.id}`,
      Cliente: t.casaMatriz?.razonSocial || '-',
      'Técnico Asignado': t.tecnicoAsignado?.name || 'Sin asignar',
      'Fecha Creación': this.formatDate(t.createdAt),
      'Fecha Cierre': t.fechaTermino ? this.formatDate(t.fechaTermino) : '-',
      Estado: t.estadoTicket,
      Prioridad: t.prioridad,
      Tipo: t.tipo,
      'Tiempo SLA (hrs)': t.tiempoResolucionHoras
        ? Math.round(t.tiempoResolucionHoras)
        : '-',
      'Status SLA': this.getSlaStatusLabel(t.slaStatus),
      Transferencias: Array.isArray(t.historialTransferencias)
        ? t.historialTransferencias.length
        : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets SLA');

    // Generate filename with current date
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `reporte_tickets_sla_${fecha}.xlsx`);
  }

  getSlaStatusLabel(status?: string): string {
    switch (status) {
      case 'excelente':
        return 'Excelente';
      case 'bueno':
        return 'Bueno';
      case 'advertencia':
        return 'Atención';
      case 'critico':
        return 'Crítico';
      default:
        return '-';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTiempoSLA(horas?: number): string {
    if (horas === undefined || horas === null) return '-';
    if (horas < 1) {
      return `${Math.round(horas * 60)} min`;
    } else if (horas < 24) {
      return `${Math.round(horas)} hrs`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = Math.round(horas % 24);
      return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
    }
  }

  getDetallesString(detalles: any): string {
    if (!detalles) return '';
    if (typeof detalles === 'string') return detalles;
    return JSON.stringify(detalles, null, 2);
  }

  getTransferenciasTooltip(ticket: TicketSLA): string {
    if (
      !ticket.historialTransferencias ||
      ticket.historialTransferencias.length === 0
    ) {
      return 'Sin transferencias';
    }
    return ticket.historialTransferencias
      .map(
        (t: any) =>
          `${t.de || 'N/A'} → ${t.a || 'N/A'} (${
            t.fecha ? this.formatDate(t.fecha) : 'N/A'
          })`
      )
      .join('\n');
  }
}
