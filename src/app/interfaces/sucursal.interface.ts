import { Cliente } from "./cliente.interface";

export interface Sucursal {
  id:                string;
  encargadoSucursal: string;
  correoSucursal:    string;
  telefonoSucursal:  number;
  sucursal:          string;
  fechaIngreso:      Date;
  direccion:         string;
  habilitado:        boolean;
  clienteId:         string;
  Cliente:           Cliente;
  equiposCount?: number;
}
