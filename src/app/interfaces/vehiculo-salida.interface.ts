import { Tecnico } from './tecnico.interface';

export type MetodoPagoCombustible =
  | 'Efectivo'
  | 'Tarjeta'
  | 'Copec Personas'
  | 'Copec Empresas';

export interface VehiculoSalidaAdjunto {
  id: number;
  vehiculoSalidaId: number;
  archivo: string;
  nombreArchivo: string | null;
  mimeType: string | null;
  tipo: 'general' | 'comprobante';
  createdAt: string;
  updatedAt: string;
}

export interface VehiculoSalida {
  id: number;
  vehiculoId: number;
  fechaHoraSalida: string;
  fechaHoraLlegada: string | null;
  odometroSalida: number;
  odometroLlegada: number | null;
  cargaCombustible: boolean;
  metodoPago: MetodoPagoCombustible | null;
  valorCarga: number | null;
  comentarios: string | null;
  adjuntos: VehiculoSalidaAdjunto[];
  tecnicos: Tecnico[];
  createdAt?: string;
  updatedAt?: string;
}

