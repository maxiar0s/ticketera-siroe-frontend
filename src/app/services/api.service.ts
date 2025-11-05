import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import { ClienteResumen } from '../interfaces/cliente-resumen.interface';
import { Equipo } from '../interfaces/equipo.interface';
import { VisitaProgramada } from '../interfaces/visita-programada.interface';
import { Tecnico } from '../interfaces/tecnico.interface';
import { Cuenta } from '../interfaces/Cuenta.interface';
import { TipoEquipo } from '../interfaces/TipoEquipo.interface';
import { Campo, CampoPresetOption, CampoStandard } from '../interfaces/campo.interface';
import { DepartamentoEquipo } from '../interfaces/departamento-equipo.interface';
import { EquipoFiltros } from '../interfaces/equipo-filtros.interface';

type ClienteEquiposDetalle = { cliente: Cliente | null; equipos: Equipo[] };

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //private url = 'https://api-soporte-siroe.onrender.com';
  //private url = 'http://167.71.172.190:3000';
  //private url = 'https://167.71.172.190';

  private url = 'http://localhost:3000';
  //private url = 'https://api.soportesiroe.cl'

  private readonly equiposClienteCache = new Map<string, ClienteEquiposDetalle>();

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    const endpoint = 'auth/login';
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data).pipe(
      catchError((error) => {
        console.error(error);
        return of(null);
      })
    );
  }

  // POST
  createClient(data: any): Observable<any> {
    const endpoint = 'ingresar-cliente';
    return this.postInformation(data, endpoint);
  }

  createModifyBranch(data: any): Observable<any> {
    const endpoint = 'ingresar-sucursal';
    return this.postInformation(data, endpoint);
  }

  createModifyUser(data: any): Observable<any> {
    const endpoint = 'crear-modificar-cuenta';
    return this.postInformation(data, endpoint);
  }

  // Equiptment
  createEquiptment(data: any): Observable<any> {
    const endpoint = 'ingresar-equipo';
    return this.postInformation(data, endpoint);
  }
  modifyEquiptment(data: FormData): Observable<any> {
    const id = data.get('id');
    if (!id) {
      return throwError(() => new Error('ID de equipo no proporcionado'));
    }

    const endpoint = 'modificar-equipo/' + id;
    const sanitizedData = new FormData();

    data.forEach((value: any, key: string) => {
      if (key === 'id' || key === 'estado' || key === 'text') {
        return;
      }

      if (value === null || value === undefined) {
        return;
      }

      if (value instanceof File || value instanceof Blob) {
        sanitizedData.append(key, value);
        return;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed.toLowerCase() === 'null') {
          sanitizedData.append(key, '');
          return;
        }

        sanitizedData.append(key, trimmed);
        return;
      }

      sanitizedData.append(key, value);
    });

    return this.postInformation(sanitizedData, endpoint);
  }
  deleteEquipment(id: number) {
    return this.deleteInformation(`equipos/${id}`);
  }

  createComment(data: any): Observable<any> {
    const { equipoId: id } = data;
    const endpoint = 'ingresar-observacion/' + id;
    return this.postInformation(data, endpoint);
  }

  // GET
  deleteUser(id: number): Observable<any> {
    const endpoint = `eliminar-cuenta/${id}`;
    return this.getInformation(endpoint);
  }

  deleteBranch(id: string): Observable<any> {
    const endpoint = `eliminar-sucursal/${id}`;
    return this.getInformation(endpoint);
  }

  // Casas Matricez
  clients(pagina: number): Observable<any> {
    const endpoint = `clientes?pagina=${pagina}`;
    return this.getInformation(endpoint);
  }

  clientesResumen(): Observable<ClienteResumen[]> {
    const endpoint = 'clientes/listado';
    return this.getInformation(endpoint);
  }

  tecnicosDisponibles(): Observable<Tecnico[]> {
    const endpoint = 'tecnicos';
    return this.http.get<Tecnico[]>(`${this.url}/${endpoint}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener tÃ©cnicos disponibles:', error);
        return of([] as Tecnico[]);
      })
    );
  }

  clientesBitacora(): Observable<any> {
    const endpoint = 'bitacoras/clientes';
    return this.getInformation(endpoint);
  }

  client(id: string, pagina: number, option: string): Observable<any> {
    let endpoint = 'cliente/' + id + `?pagina=${pagina}`;
    if (option) {
      endpoint = 'cliente/' + id + `?pagina=${pagina}&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

  clientSinCache(id: string, pagina: number, option: string): Observable<any> {
    const url = `${this.url}/cliente/${id}`;
    let params = new HttpParams().set('pagina', pagina);
    if (option) {
      params = params.set('option', option);
    }
    params = params.set('_ts', Date.now());

    return this.http.get<any>(url, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud GET sin cache:', error);
        return throwError(() => error);
      })
    );
  }
  sucursalesPorCliente(id: string): Observable<any> {
    const endpoint = `cliente/${id}/sucursales`;
    return this.getInformation(endpoint);
  }

  // *: Eliminar cliente
  eliminarCliente(id: string): Observable<any> {
    const endpoint = `clientes/${id}`;
    return this.deleteInformation(endpoint);
  }

  // *: Modificar cliente
  modificarCliente(id: string, datos: any): Observable<any> {
    const endpoint = `modificar-cliente/${id}`;
    // Si datos es un FormData, lo enviamos como multipart/form-data
    if (datos instanceof FormData) {
      // Enviar el FormData directamente, permitiendo la subida de archivos
      return this.http.post<any>(`${this.url}/${endpoint}`, datos).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en la solicitud POST:', error);
          return throwError(() => error);
        })
      );
    } else {
      // Si no es FormData, usamos el mÃ©todo postInformation normal
      return this.postInformation(datos, endpoint);
    }
  }

  // Sucursal
  sucursal(id: string, pagina: number, option: string, filtros?: EquipoFiltros): Observable<any> {
    let params = new HttpParams()
      .set('pagina', String(pagina))
      .set('sort', 'asc');

    if (option) {
      params = params.set('option', option);
    }

    if (filtros) {
      const {
        fechaInicio,
        fechaFin,
        tipoEquipoIds,
        departamentos,
        ramMin,
        ramMax,
        almacenamientoMin,
        almacenamientoMax,
        conRegistroFotografico,
      } = filtros;

      if (fechaInicio) {
        params = params.set('fechaInicio', fechaInicio);
      }

      if (fechaFin) {
        params = params.set('fechaFin', fechaFin);
      }

      if (Array.isArray(tipoEquipoIds) && tipoEquipoIds.length > 0) {
        params = params.set('tipoEquipoIds', tipoEquipoIds.join(','));
      }

      if (Array.isArray(departamentos) && departamentos.length > 0) {
        params = params.set('departamentos', departamentos.join(','));
      }

      if (ramMin !== undefined && ramMin !== null) {
        params = params.set('ramMin', String(ramMin));
      }

      if (ramMax !== undefined && ramMax !== null) {
        params = params.set('ramMax', String(ramMax));
      }

      if (almacenamientoMin !== undefined && almacenamientoMin !== null) {
        params = params.set('almacenamientoMin', String(almacenamientoMin));
      }

      if (almacenamientoMax !== undefined && almacenamientoMax !== null) {
        params = params.set('almacenamientoMax', String(almacenamientoMax));
      }

      if (typeof conRegistroFotografico === 'boolean') {
        params = params.set('conRegistroFotografico', String(conRegistroFotografico));
      }
    }

    return this.http
      .get<any>(`${this.url}/sucursal/${id}`, { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en la solicitud GET:', error);
          return throwError(() => error);
        })
      );
  }

  // Crear o modificar usuario
  users(pagina: number, option: string): Observable<any> {
    let endpoint = `usuarios` + `?pagina=${pagina}`;
    if (option) {
      endpoint = endpoint + `&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

  perfilActual(): Observable<Cuenta> {
    const endpoint = 'perfil';
    return this.getInformation(endpoint);
  }

  actualizarPerfil(payload: {
    name?: string;
    telefono?: number | null;
    email?: string;
    passwordActual?: string;
    nuevoPassword?: string;
  }): Observable<any> {
    const endpoint = 'perfil';
    return this.putInformation(payload, endpoint);
  }

  typeEquipments(): Observable<TipoEquipo[]> {
    const endpoint = 'tipos-equipos';
    return this.getInformation(endpoint);
  }

  createEquipmentType(payload: {
    name: string;
    dict: string;
    campoIds?: number[];
  }): Observable<TipoEquipo> {
    const endpoint = 'tipos-equipos';
    return this.postInformation(payload, endpoint);
  }

  updateEquipmentType(
    id: number,
    payload: { name?: string; dict?: string; campoIds?: number[] }
  ): Observable<TipoEquipo> {
    const endpoint = `tipos-equipos/${id}`;
    return this.putInformation(payload, endpoint);
  }

  deleteEquipmentType(id: number): Observable<any> {
    const endpoint = `tipos-equipos/${id}`;
    return this.deleteInformation(endpoint);
  }

  getEquipmentTypeFields(tipoEquipoId: number): Observable<Campo[]> {
    const endpoint = `tipos-equipos/${tipoEquipoId}/campos`;
    return this.getInformation(endpoint);
  }

  updateEquipmentTypeFields(
    tipoEquipoId: number,
    campoIds: number[]
  ): Observable<Campo[]> {
    const endpoint = `tipos-equipos/${tipoEquipoId}/campos`;
    return this.putInformation({ campoIds }, endpoint);
  }

  getCamposCatalog(): Observable<Campo[]> {
    const endpoint = 'campos';
    return this.getInformation(endpoint);
  }

  createCampo(payload: {
    name: string;
    label: string;
    type: string;
    placeholder?: string | null;
    required?: boolean;
    presetOptions?: CampoPresetOption[];
    standards?: CampoStandard[];
  }): Observable<Campo> {
    const endpoint = 'campos';
    return this.postInformation(payload, endpoint);
  }

  updateCampo(
    id: number,
    payload: Partial<{
      name: string;
      label: string;
      type: string;
      placeholder: string | null;
      required: boolean;
      presetOptions: CampoPresetOption[];
      standards: CampoStandard[];
    }>
  ): Observable<Campo> {
    const endpoint = `campos/${id}`;
    return this.putInformation(payload, endpoint);
  }

  deleteCampo(id: number): Observable<any> {
    const endpoint = `campos/${id}`;
    return this.deleteInformation(endpoint);
  }

  getDepartamentosEquipo(): Observable<DepartamentoEquipo[]> {
    const endpoint = 'departamentos-equipos';
    return this.getInformation(endpoint);
  }

  createDepartamentoEquipo(payload: { name: string }): Observable<DepartamentoEquipo> {
    const endpoint = 'departamentos-equipos';
    return this.postInformation(payload, endpoint);
  }

  updateDepartamentoEquipo(
    id: number,
    payload: { name: string }
  ): Observable<DepartamentoEquipo> {
    const endpoint = `departamentos-equipos/${id}`;
    return this.putInformation(payload, endpoint);
  }

  deleteDepartamentoEquipo(id: number): Observable<any> {
    const endpoint = `departamentos-equipos/${id}`;
    return this.deleteInformation(endpoint);
  }

  formEquipment(tipoEquipoId: string): Observable<any> {
    const endpoint = `obtener-formulario/` + tipoEquipoId;
    return this.getInformation(endpoint);
  }

  equipmentsByCasaMatriz(id: string): Observable<Equipo[]> {
    if (!id) {
      return of([]);
    }
    const endpoint = `cliente/` + id + `/equipos`;
    return this.getInformation(endpoint).pipe(
      map((respuesta) => {
        if (Array.isArray(respuesta)) {
          return respuesta as Equipo[];
        }

        if (respuesta && Array.isArray(respuesta?.equipos)) {
          return respuesta.equipos as Equipo[];
        }

        return [] as Equipo[];
      })
    );
  }

  equiposPorClienteCompleto(id: string): Observable<ClienteEquiposDetalle> {
    if (!id) {
      return of({ cliente: null, equipos: [] });
    }

    const cached = this.equiposClienteCache.get(id);
    if (cached) {
      return of(cached);
    }

    const detalle$ = this.clientSinCache(id, 1, '').pipe(
      catchError((error) => {
        console.error('Error al obtener detalle del cliente:', error);
        return of(null);
      })
    );

    const equipos$ = this.equipmentsByCasaMatriz(id).pipe(
      catchError((error) => {
        console.error('Error al obtener equipos del cliente:', error);
        return of([] as Equipo[]);
      })
    );

    return forkJoin({ detalle: detalle$, equipos: equipos$ }).pipe(
      map(({ detalle, equipos }) => {
        const clienteBase = detalle?.cliente as Cliente | undefined;
        const clienteDetalle: Cliente | null = clienteBase
          ? ({ ...clienteBase, sucursales: Array.isArray(clienteBase.sucursales) ? clienteBase.sucursales.map((sucursal: any) => ({ ...sucursal })) : [] } as Cliente)
          : null;

        const equiposDesdeDetalle = this.extraerEquiposDeDetalle(clienteDetalle);
        const equiposNormalizados = this.unificarEquiposListas([equiposDesdeDetalle, equipos]);

        if (clienteDetalle && Array.isArray(clienteDetalle.sucursales)) {
          const conteoPorSucursal = this.contarEquiposPorSucursal(equiposNormalizados);
          clienteDetalle.sucursales = clienteDetalle.sucursales.map((sucursal: any) => {
            const clave = String(sucursal.id ?? '');
            const conteo = conteoPorSucursal.get(clave);
            const existente = typeof sucursal.equiposCount === 'number' ? Number(sucursal.equiposCount) : undefined;
            return {
              ...sucursal,
              equiposCount: existente !== undefined ? existente : (conteo ?? 0),
            };
          });
        }

        const resultado: ClienteEquiposDetalle = {
          cliente: clienteDetalle,
          equipos: equiposNormalizados,
        };

        this.equiposClienteCache.set(id, resultado);
        return resultado;
      }),
      catchError((error) => {
        console.error('Error al consolidar la informacion de equipos:', error);
        return of({ cliente: null, equipos: [] });
      })
    );
  }

  limpiarEquiposClienteCache(): void {
    this.equiposClienteCache.clear();
  }

  private extraerEquiposDeDetalle(cliente: any): Equipo[] {
    if (!cliente) {
      return [];
    }

    const equiposMap = new Map<number | string, Equipo>();

    if (Array.isArray(cliente?.sucursales)) {
      cliente.sucursales.forEach((sucursal: any) => {
        if (Array.isArray(sucursal?.equipos)) {
          sucursal.equipos.forEach((equipo: Equipo) => {
            const key = this.normalizarClaveEquipo(equipo);
            if (key) {
              equiposMap.set(key, equipo);
            }
          });
        }
        if (Array.isArray(sucursal?.Equipos)) {
          sucursal.Equipos.forEach((equipo: Equipo) => {
            const key = this.normalizarClaveEquipo(equipo);
            if (key) {
              equiposMap.set(key, equipo);
            }
          });
        }
      });
    }

    const listadoAlternativo = Array.isArray(cliente?.Equipos)
      ? cliente.Equipos
      : Array.isArray(cliente?.equipos)
        ? cliente.equipos
        : [];

    listadoAlternativo.forEach((equipo: Equipo) => {
      const key = this.normalizarClaveEquipo(equipo);
      if (key) {
        equiposMap.set(key, equipo);
      }
    });

    return Array.from(equiposMap.values());
  }

  private unificarEquiposListas(listados: Array<Equipo[] | null | undefined>): Equipo[] {
    const mapa = new Map<string, Equipo>();

    listados.forEach((lista) => {
      if (!Array.isArray(lista)) {
        return;
      }

      lista.forEach((equipo) => {
        const key = this.normalizarClaveEquipo(equipo);
        if (!key) {
          return;
        }

        const previo = mapa.get(key) ?? {};
        mapa.set(key, { ...previo, ...equipo });
      });
    });

    return Array.from(mapa.values());
  }

  private contarEquiposPorSucursal(listado: Equipo[]): Map<string, number> {
    const conteo = new Map<string, number>();

    listado.forEach((equipo) => {
      const sucursalId = (equipo as any)?.sucursalId ?? (equipo as any)?.sucursal?.id;
      if (sucursalId === undefined || sucursalId === null) {
        return;
      }
      const clave = String(sucursalId);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });

    return conteo;
  }

  private normalizarClaveEquipo(equipo: Equipo | null | undefined): string | null {
    if (!equipo) {
      return null;
    }

    const clave =
      (equipo.id !== undefined && equipo.id !== null ? equipo.id : undefined) ??
      (equipo.codigoId && String(equipo.codigoId).trim() !== '' ? equipo.codigoId : undefined) ??
      (equipo.numeroSecuencial !== undefined && equipo.numeroSecuencial !== null
        ? `ns-${equipo.numeroSecuencial}`
        : undefined);

    if (clave === undefined) {
      return null;
    }

    const texto = String(clave).trim();
    return texto === '' ? null : texto;
  }

  bitacoras(params: Record<string, any> = {}): Observable<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      const stringValue = typeof value === 'string' ? value.trim() : String(value);
      if (stringValue !== '') {
        searchParams.append(key, stringValue);
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `bitacoras?${query}` : 'bitacoras';
    return this.getInformation(endpoint);
  }

  bitacora(id: number): Observable<any> {
    const endpoint = `bitacoras/${id}`;
    return this.getInformation(endpoint);
  }

  eliminarBitacora(id: number): Observable<any> {
    const endpoint = `bitacoras/${id}`;
    return this.deleteInformation(endpoint);
  }

  visitasProgramadas(): Observable<VisitaProgramada[]> {
    const endpoint = 'visitas-programadas';
    return this.getInformation(endpoint);
  }

  crearVisitaProgramada(payload: any): Observable<any> {
    const endpoint = 'visitas-programadas';
    return this.postInformation(payload, endpoint);
  }

  eliminarVisitaProgramada(id: number): Observable<any> {
    const endpoint = `visitas-programadas/${id}`;
    return this.deleteInformation(endpoint);
  }

  crearBitacora(payload: any): Observable<any> {
    const endpoint = 'bitacoras';
    return this.postInformation(payload, endpoint);
  }

  actualizarBitacora(id: number, payload: any): Observable<any> {
    const endpoint = `bitacoras/${id}`;
    return this.putInformation(payload, endpoint);
  }

  getProyectos(params: { pagina?: number; limite?: number; buscar?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.pagina) {
      httpParams = httpParams.set('pagina', params.pagina.toString());
    }
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }
    if (params.buscar && params.buscar.trim().length) {
      httpParams = httpParams.set('buscar', params.buscar.trim());
    }

    return this.http
      .get<any>(`${this.url}/proyectos`, { params: httpParams })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener proyectos:', error);
          return throwError(() => error);
        })
      );
  }

  getProyecto(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/proyectos/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener el proyecto:', error);
        return throwError(() => error);
      })
    );
  }

  crearProyecto(payload: any): Observable<any> {
    const endpoint = 'proyectos';
    return this.postInformation(payload, endpoint);
  }

  actualizarProyecto(id: number, payload: any): Observable<any> {
    const endpoint = `proyectos/${id}`;
    return this.putInformation(payload, endpoint);
  }

  eliminarProyecto(id: number): Observable<any> {
    const endpoint = `proyectos/${id}`;
    return this.deleteInformation(endpoint);
  }

  agregarAdjuntosProyecto(id: number, payload: any): Observable<any> {
    const endpoint = `proyectos/${id}/adjuntos`;
    return this.postInformation(payload, endpoint);
  }

  asignarBitacorasAProyecto(id: number, payload: any): Observable<any> {
    const endpoint = `proyectos/${id}/bitacoras`;
    return this.postInformation(payload, endpoint);
  }

  removerBitacoraDeProyecto(id: number, bitacoraId: number): Observable<any> {
    const endpoint = `proyectos/${id}/bitacoras/${bitacoraId}`;
    return this.deleteInformation(endpoint);
  }

  eliminarProyectoAdjunto(id: number, adjuntoId: number): Observable<any> {
    const endpoint = `proyectos/${id}/adjuntos/${adjuntoId}`;
    return this.deleteInformation(endpoint);
  }

  // Obtener equipo por ID
  equiptment(id: number): Observable<any> {
    const endpoint = `equipo/` + id;
    return this.getInformation(endpoint);
  }

  // ?Obtener estados de equipos
  getEstadosEquipo(): Observable<any> {
    const endpoint = 'estados-equipos';
    return this.getInformation(endpoint);
  }

  // ?Actualizar estado de equipo
  actualizarEstadoEquipo(id: number, estado: string): Observable<any> {
    const endpoint = `actualizar-estado-equipo/${id}`;
    return this.http.post<any>(`${this.url}/${endpoint}`, { estado }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar estado del equipo:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener estados de sucursales
  getEstadosSucursal(): Observable<any> {
    const endpoint = 'estados-sucursales';
    return this.getInformation(endpoint);
  }

  // Actualizar estado de sucursal
  actualizarEstadoSucursal(id: string, estado: string): Observable<any> {
    const endpoint = `actualizar-estado-sucursal/${id}`;
    return this.http.post<any>(`${this.url}/${endpoint}`, { estado }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar estado de la sucursal:', error);
        return throwError(() => error);
      })
    );
  }

  // Metodos principales
  getInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.get<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud GET:', error);
        return throwError(() => error);
      })
    );
  }

  postInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud POST:', error);
        return throwError(() => error);
      })
    );
  }

  putInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.put<any>(url, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud PUT:', error);
        return throwError(() => error);
      })
    );
  }

  deleteInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.delete<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud DELETE:', error);
        return throwError(() => error);
      })
    );
  }

  // Consumo de imagenes GCS (Google Cloud Storage)
  signedUrl(fileName: string): Observable<any> {
    const apiUrl = `${this.url}/api/generar-url/${fileName}`;
    return this.http
      .get<{ signedUrl: string }>(apiUrl)
      .pipe(map((response) => response.signedUrl));
  }

  // Verificar si correo electronico existe en la cuenta
  verificarCorreoExistente(correo: string): Observable<boolean> {
    return this.http
      .get<{ isTaken: boolean }>(
        `${this.url}/verificar-correo?correo=${correo}`
      )
      .pipe(
        map((response) => {
          return response.isTaken;
        })
      );
  }
}



