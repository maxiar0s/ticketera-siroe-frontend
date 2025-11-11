export interface Bitacora {
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
  creadoPor?: {
    id: number;
    name: string;
    email: string;
  };
  actualizadoPor?: {
    id: number;
    name: string;
    email: string;
  };
  adjuntos?: string[];
  adjuntosTermino?: string[];
  esTicket?: boolean;
  estadoTicket?: 'ingresado' | 'terminado' | null;
  fechaTermino?: string | null;
  detalleTermino?: string | null;
  proyectoId?: number | null;
  proyecto?: {
    id: number;
    nombre: string;
    fotoPortada?: string | null;
  } | null;
}

export interface BitacoraListadoResponse {
  data: Bitacora[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
