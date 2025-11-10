export type DocumentoClienteTipo = 'factura' | 'contrato' | 'otros';

export interface DocumentoCliente {
  id: number;
  casaMatrizId: string;
  tipo: DocumentoClienteTipo;
  descripcion: string | null;
  archivo: string;
  nombreArchivo: string | null;
  mimeType: string | null;
  size?: number | null;
  subidoPorId?: number | null;
  createdAt: string;
  updatedAt: string;
  casaMatriz?: {
    id: string;
    razonSocial: string;
    rut?: string;
  } | null;
  subidoPor?: {
    id: number;
    name: string;
    email: string;
    tipoCuentaId?: number;
  } | null;
}

export interface DocumentoClienteListado {
  data: DocumentoCliente[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
