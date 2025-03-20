import { Cliente } from "./cliente.interface";
import { Equipo } from "./equipo.interface";

export interface Sucursal {
  id:                string;
  estado:            number;
  encargadoSucursal: string;
  correoSucursal:    string;
  telefonoSucursal:  number;
  sucursal:          string;
  fechaIngreso:      Date;
  direccion:         string;
  casaMatrizId:      string;
  casaMatriz:        Cliente;
  equiposCount?:     number;
  equipos:           Equipo[];
}



