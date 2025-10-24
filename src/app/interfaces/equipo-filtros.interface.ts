export interface EquipoFiltros {
  fechaInicio?: string;
  fechaFin?: string;
  tipoEquipoIds?: number[];
  departamentos?: string[];
  ramMin?: number;
  ramMax?: number;
  almacenamientoMin?: number;
  almacenamientoMax?: number;
  conRegistroFotografico?: boolean | null;
}

