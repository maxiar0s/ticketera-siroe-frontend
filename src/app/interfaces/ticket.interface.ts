export interface Ticket {
  id: number;
  titulo: string | null;
  descripcion: string;
  tecnicos: string[];
  fechaVisita: string;
  horaLlegada: string | null;
  horaSalida: string | null;
  casaMatrizId: string;
  sucursalId: string | null;
  creadoPorId: number;
  actualizadoPorId: number;
  createdAt: string;
  updatedAt: string;
  isEmergencia: boolean;
  estadoTicket:
    | 'Nuevo'
    | 'Abierto'
    | 'Pendiente'
    | 'En espera'
    | 'Resuelto'
    | 'Cerrado';
  fechaTermino: string | null;
  detalleTermino: string | null;
  adjuntos?: string[];
  adjuntosTermino?: string[];
  casaMatriz?: {
    id: string;
    razonSocial: string;
    rut?: string;
    esLead?: boolean;
  };
  sucursal?: {
    id: string;
    sucursal: string;
    estado?: number;
  };
  proyectoId?: number | null;
  proyecto?: {
    id: number;
    nombre: string;
    fotoPortada?: string | null;
  } | null;
  prioridad: 'Baja' | 'Media' | 'Alta';

  fuente: 'Web' | 'Email' | 'Telegram IA';
  fechaRespuesta?: string | null;
  historialEstados?: string[];
  tecnicoAsignadoId?: number;
  historialTransferencias?: {
    fromId: number;
    toId: number;
    date: string;
    by: number;
  }[];
  comentarioInterno?: string | null;
  tiempoResolucion?: number | null;
  tags?: {
    id: number;
    nombre: string;
    color: string;
  }[];
}

export interface TicketListadoResponse {
  data: Ticket[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
