import { Sucursal } from "./Sucursal.interface";
export interface Cliente {
  id:                string;
  imagen:            string;
  rut:               string;
  razonSocial:       string;
  encargadoGeneral:  string;
  correo:            string;
  servicios?:        string[];
  telefonoEncargado: number;
  fechaIngreso:      Date;
  visitasMensuales:  number | null;
  visitasEmergenciaAnuales: number | null;
  visitasMensualesRealizadas?: number;
  visitasEmergenciaAnualesRealizadas?: number;
  Equipos?:           any[];
  sucursales?:        Sucursal[];
}
