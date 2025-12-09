/**
 * Interfaces para el sistema de mensajes de tickets.
 */

export interface MensajeTicket {
  id: number;
  ticketId: number;
  cuentaId: number;
  remitente?: {
    id: number;
    name: string;
    tipoCuentaId: number;
  };
  mensaje: string;
  adjuntos: string[];
  leido: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  itemType?: 'mensaje';
}

export interface ActividadTicket {
  id: number;
  ticketId: number;
  cuentaId: number;
  realizadoPor?: {
    id: number;
    name: string;
    tipoCuentaId: number;
  };
  tipo:
    | 'estado'
    | 'prioridad'
    | 'transferencia'
    | 'asignacion'
    | 'creacion'
    | 'comentario'
    | 'adjunto';
  valorAnterior: string | null;
  valorNuevo: string | null;
  metadata: Record<string, any>;
  createdAt: Date | string;
  itemType?: 'actividad';
}

export type ChatItem =
  | (MensajeTicket & { itemType: 'mensaje' })
  | (ActividadTicket & { itemType: 'actividad' });

export interface MensajesTicketResponse {
  data: MensajeTicket[];
  total: number;
  pagina: number;
  paginasTotales: number;
}

export interface ActividadTicketResponse {
  data: ActividadTicket[];
  total: number;
  pagina: number;
  paginasTotales: number;
}

export interface TimelineTicketResponse {
  data: ChatItem[];
  total: number;
}
