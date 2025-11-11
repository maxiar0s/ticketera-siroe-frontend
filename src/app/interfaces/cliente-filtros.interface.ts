export interface ClienteFiltros {
  servicios?: string[];
  visitasMensualesMin?: number | null;
  visitasMensualesMax?: number | null;
  visitasEmergenciaMin?: number | null;
  visitasEmergenciaMax?: number | null;
  esLead?: boolean | null;
  tieneDatosBancarios?: boolean | null;
}
