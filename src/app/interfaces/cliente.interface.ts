import { Sucursal } from "./sucursal.interface";
export interface Cliente {
  id:                string;
  imagen:            string;
  rut:               string;
  razonSocial:       string;
  encargadoGeneral:  string;
  correo:            string;
  telefonoEncargado: number;
  fechaIngreso:      Date;
  Equipos?:           any[];
  sucursales?:        Sucursal[];
}

