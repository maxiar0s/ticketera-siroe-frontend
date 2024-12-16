export interface Equipo {
  id:                     number;
  numeroSecuencial:       number;
  codigoId:               string;
  tipo:                   string;
  fechaIngreso:           Date;
  departamento:           string;
  usuario:                string;
  marca:                  string;
  modelo:                 string;
  numeroSerie:            string;
  procesador:             string;
  velocidadProcesador:    string;
  ram:                    number;
  tipoAlmacenamiento:     string;
  cantidadAlmacenamiento: number;
  sistemaOperativo:       string;
  ofimatica:              string;
  antivirus:              string;
  observaciones:          string;
  clienteId:              null;
  sucursalId:             string;
  Cliente:                null;
}
