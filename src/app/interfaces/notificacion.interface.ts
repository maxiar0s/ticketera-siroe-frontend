export interface NotificacionMetadata {
  cliente?: string;
  fecha?: string | null;
  esTicket?: boolean;
  bitacoraId?: number | null;
  ticketId?: number | null;
  titulo?: string | null;
  remitenteNombre?: string;
  ticketTitulo?: string;
  [key: string]: unknown;
}

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId: number | null;
  referenciaTipo: string | null;
  leida: boolean;
  metadata: NotificacionMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificacionListadoRespuesta {
  notificaciones: Notificacion[];
  totalNoLeidas: number;
}
