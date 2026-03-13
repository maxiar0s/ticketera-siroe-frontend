import { EstadoCuenta } from "./EstadoCuenta.interface";
import { TipoCuenta } from "./TipoCuenta.interface";
import { ClienteResumen } from "./cliente-resumen.interface";
import { ModuleAccessMap } from '../config/modules';

export interface Cuenta {
  id:             number;
  name:           string;
  telefono:       number | null;
  email:          string;
  tipoCuentaId?:  number;
  tipoCuenta?:    TipoCuenta;
  estadoCuentaId?: number;
  estadoCuenta?:   EstadoCuenta;
  esTecnico?:      boolean;
  ocupacion?:      string | null;
  haveTickets?:    boolean;
  clientesAutorizados?: ClienteResumen[];
  modulosAcceso?:  ModuleAccessMap;
}
