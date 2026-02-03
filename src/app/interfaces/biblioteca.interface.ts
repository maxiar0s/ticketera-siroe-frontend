export interface BibliotecaAdjunto {
  id: number;
  bibliotecaProyectoId: number;
  archivo: string;
  nombreArchivo: string | null;
  mimeType: string | null;
  seccion?: string;
  columnaId?: string;
  subidoPor?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Definición de columna para categorías
export interface CategoriaColumna {
  id: string;
  nombre: string;
  tipoTexto: 'normal' | 'privado' | null;
  permiteAdjuntos: boolean;
  orden: number;
}

// Categoría de biblioteca (licitaciones, políticas, leyes, proyectos, etc.)
export interface BibliotecaCategoria {
  id: number;
  nombre: string;
  color: string;
  columnas: CategoriaColumna[];
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

// Contenido dinámico por columna
export interface ContenidoColumna {
  texto?: string;
}

// Documento de biblioteca (antes BibliotecaProyecto)
export interface BibliotecaProyecto {
  id: number;
  casaMatrizId: string | null;
  casaMatriz?: {
    id: string;
    razonSocial: string;
    imagen?: string;
  } | null;
  categoriaId?: number | null;
  categoria?: BibliotecaCategoria | null;
  nombre: string;
  descripcion: string | null;
  contenido?: Record<string, ContenidoColumna>;
  // Campos legacy (retrocompatibilidad)
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
