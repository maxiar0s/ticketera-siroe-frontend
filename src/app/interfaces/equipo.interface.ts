import { TipoEquipo } from "./TipoEquipo.interface";

export interface Equipo {
  id:                     number;
  numeroSecuencial:       number;
  codigoId:               string;
  estado:                 number;
  fechaIngreso:           Date;
  departamento:           string;
  usuario:                string;
  imagen:                 null;
  marca:                  null;
  modelo:                 null;
  numeroSerie:            null;
  procesador:             null;
  velocidadProcesador:    null;
  ram:                    null;
  tipoAlmacenamiento:     null;
  cantidadAlmacenamiento: null;
  sistemaOperativo:       null;
  ofimatica:              null;
  antivirus:              null;
  casaMatrizId:           null;
  sucursalId:             string;
  tipoEquipoId:           number;
  tipoEquipo:             TipoEquipo;
}

