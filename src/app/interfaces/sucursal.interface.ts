import { Cliente } from "./cliente.interface";

export interface Sucursal {
  id:                string;
  estado:            number;
  encargadoSucursal: string;
  correoSucursal:    string;
  telefonoSucursal:  number;
  sucursal:          string;
  fechaIngreso:      Date;
  direccion:         string;
  clienteId:         string;
  Cliente:           Cliente;
  equiposCount?: number;
}
