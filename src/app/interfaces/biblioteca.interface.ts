export interface BibliotecaAdjunto {
  id: number;
  bibliotecaProyectoId: number;
  archivo: string;
  nombreArchivo: string | null;
  mimeType: string | null;
  seccion?: string;
  subidoPor?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BibliotecaProyecto {
  id: number;
  casaMatrizId: string;
  casaMatriz?: {
    id: string;
    razonSocial: string;
    imagen?: string;
  } | null;
  nombre: string;
  descripcion: string | null;
  linkRepositorio: string | null;
  envVariables: string | null;
  credenciales?: string | null;
  instruccionesInstalacion: string | null;
  instruccionesProd: string | null;
  manualUsuario: string | null;
  notasTecnicas: string | null;
  tecnologias: string[];
  adjuntos: BibliotecaAdjunto[];
  creadoPor?: {
    id: number;
    name: string;
    email: string;
  } | null;
  actualizadoPor?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BibliotecaListadoResponse {
  data: BibliotecaProyecto[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
