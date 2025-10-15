export interface Bitacora {
  id: number;
  titulo: string | null;
  descripcion: string;
  tecnicos: string[];
  fechaVisita: string;
  horaLlegada: string;
  horaSalida: string;
  casaMatrizId: string;
  sucursalId: string | null;
  creadoPorId: number;
  actualizadoPorId: number;
  createdAt: string;
  updatedAt: string;
  casaMatriz?: {
    id: string;
    razonSocial: string;
    rut?: string;
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
}

export interface BitacoraListadoResponse {
  data: Bitacora[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
