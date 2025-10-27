import { Observaciones } from "./Observaciones.interface";
import { TipoEquipo } from "./TipoEquipo.interface";

export interface Equipo {
  id:                     number;
  numeroSecuencial:       number;
  codigoId:               string;
  estado:                 number;
  fechaIngreso:           Date;
  departamento:           string;
  usuario:                string;
  imagen:                 string | undefined;
  placaMadre:             string | null;
  fuenteDePoder:          string | null;
  marca:                  string | null;
  modelo:                 string | null;
  numeroSerie:            string | null;
  procesador:             string | null;
  velocidadProcesador:    string | null;
  ram:                    string | null;
  tipoAlmacenamiento:     string | null;
  cantidadAlmacenamiento: string | null;
  sistemaOperativo:       string | null;
  ofimatica:              string | null;
  antivirus:              string | null;
  observaciones:          Observaciones[];
  casaMatrizId:           string | null;
  sucursalId:             string;
  tipoEquipoId:           number;
  tipoEquipo:             TipoEquipo;
  esArriendo?:            boolean;
}

