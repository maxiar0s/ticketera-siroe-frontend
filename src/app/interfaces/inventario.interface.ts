export interface EstadoInventario {
  id: number;
  name: string;
}

export interface Inventario {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string | null;
  valor: string | number;
  estado: number;
  estadoInventario?: EstadoInventario | null;
}

export interface InventarioListadoResponse {
  data: Inventario[];
  total: number;
  pagina: number;
  paginasTotales: number;
}
