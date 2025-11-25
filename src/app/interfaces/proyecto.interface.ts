import { Bitacora } from './bitacora.interface';
import { Ticket } from './ticket.interface';

export interface ProyectoEncargado {
  id: number;
  name: string;
  email: string;
  tipoCuentaId?: number;
}

export interface ProyectoAdjunto {
  id: number;
  proyectoId: number;
  archivo: string;
  nombreArchivo: string | null;
  mimeType: string | null;
  subidoPorId?: number | null;
  subidoPor?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string | null;
  fotoPortada: string | null;
  encargadoIds: number[];
  encargados: ProyectoEncargado[];
  fechaInicio: string | null;
  fechaTermino: string | null;
  totalBitacoras: number;
  totalTickets: number;
  adjuntos: ProyectoAdjunto[];
  bitacoras?: Bitacora[];
  tickets?: Ticket[];
  creadoPor?: ProyectoEncargado | null;
  actualizadoPor?: ProyectoEncargado | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProyectoListadoResponse {
  data: Proyecto[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
