export interface VisitaProgramada {
  id: number;
  titulo: string | null;
  descripcion: string;
  tecnicos: string[];
  fechaProgramada: string;
  horaLlegada: string | null;
  horaSalida: string | null;
  casaMatrizId: string;
  sucursalId: string | null;
  creadoPorId: number;
  actualizadoPorId: number;
  estado: string;
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
}
