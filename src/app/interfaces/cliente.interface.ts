import { Sucursal } from './Sucursal.interface';
export interface Cliente {
  id: string;
  imagen?: string | null;
  logoPerfil?: string | null;
  rut?: string | null;
  razonSocial?: string | null;
  encargadoGeneral?: string | null;
  correo?: string | null;
  servicios?: string[];
  telefonoEncargado?: number | null;
  fechaIngreso?: string | Date | null;
  visitasMensuales?: number | null;
  visitasEmergenciaAnuales?: number | null;
  visitasMensualesRealizadas?: number;
  visitasEmergenciaAnualesRealizadas?: number;
  Equipos?: any[];
  sucursales?: Sucursal[];
  tags?: {
    id: number;
    nombre: string;
    color: string;
  }[];
}
