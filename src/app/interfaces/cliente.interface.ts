import { Sucursal } from "./Sucursal.interface";
export interface Cliente {
  id:                string;
  imagen:            string;
  rut:               string;
  razonSocial:       string;
  encargadoGeneral:  string;
  correo:            string;
  telefonoEncargado: number;
  fechaIngreso:      Date;
  visitasMensuales:  number | null;
  visitasEmergenciaAnuales: number | null;
  Equipos?:           any[];
  sucursales?:        Sucursal[];
}
