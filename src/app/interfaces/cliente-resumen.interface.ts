import { DatosBancarios } from './datos-bancarios.interface';

export interface ClienteResumen {
  id: string;
  razonSocial: string;
  rut?: string | null;
  servicios?: string[];
  datosBancarios?: DatosBancarios | null;
  esLead?: boolean;
}
