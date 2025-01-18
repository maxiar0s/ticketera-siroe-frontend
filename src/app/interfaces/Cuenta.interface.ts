import { EstadoCuenta } from "./EstadoCuenta.interface";
import { TipoCuenta } from "./TipoCuenta.interface";

export interface Cuenta {
  id:             number;
  name:           string;
  telefono:       number;
  email:          string;
  tipoCuentaId:   number;
  tipoCuenta:     TipoCuenta;
  estadoCuentaId: number;
  estadoCuenta:   EstadoCuenta;
}
