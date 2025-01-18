import { Cliente } from "./Cliente.interface";
import { Equipo } from "./Equipo.interface";

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



