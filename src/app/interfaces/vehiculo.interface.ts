import { VehiculoSalida } from './vehiculo-salida.interface';

export interface Vehiculo {
  id: number;
  patente: string;
  responsable: string;
  imagen: string | null;
  fechaUltimaMantencion: string | null;
  fechaSiguienteMantencion: string | null;
  salidas?: VehiculoSalida[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VehiculoListadoResponse {
  data: Vehiculo[];
  total: number;
  pagina: number;
  paginasTotales: number;
}

