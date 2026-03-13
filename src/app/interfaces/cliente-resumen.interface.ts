export interface ClienteResumen {
  id: string;
  razonSocial: string;
  rut?: string | null;
  servicios?: string[];
}
