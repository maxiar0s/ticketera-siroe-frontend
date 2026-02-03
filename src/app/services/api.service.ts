import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  throwError,
} from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import { ClienteResumen } from '../interfaces/cliente-resumen.interface';
import { ClienteFiltros } from '../interfaces/cliente-filtros.interface';
import { Equipo } from '../interfaces/equipo.interface';
import { VisitaProgramada } from '../interfaces/visita-programada.interface';
import { Tecnico } from '../interfaces/tecnico.interface';
import { Cuenta } from '../interfaces/Cuenta.interface';
import { TipoEquipo } from '../interfaces/TipoEquipo.interface';
import {
  Campo,
  CampoPresetOption,
  CampoStandard,
} from '../interfaces/campo.interface';
import { DepartamentoEquipo } from '../interfaces/departamento-equipo.interface';
import { EquipoFiltros } from '../interfaces/equipo-filtros.interface';
import {
  Vehiculo,
  VehiculoListadoResponse,
} from '../interfaces/vehiculo.interface';
import { VehiculoSalida } from '../interfaces/vehiculo-salida.interface';
import { NotificacionListadoRespuesta } from '../interfaces/notificacion.interface';
import {
  DocumentoCliente,
  DocumentoClienteListado,
} from '../interfaces/documento-cliente.interface';
import { EstadoSucursal } from '../interfaces/estado-sucursal.interface';
import {
  BibliotecaProyecto,
  BibliotecaListadoResponse,
  BibliotecaCategoria,
} from '../interfaces/biblioteca.interface';
import { environment } from '../../environments/environment';

type ClienteEquiposDetalle = { cliente: Cliente | null; equipos: Equipo[] };

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //private url = 'https://api-soporte-siroe.onrender.com';
  //private url = 'http://167.71.172.190:3000';
  //private url = 'https://167.71.172.190';

  private url = environment.apiBaseUrl;
  //private url = 'https://api.soportesiroe.cl'

  private readonly equiposClienteCache = new Map<
    string,
    ClienteEquiposDetalle
  >();
  private estadosSucursalCache$?: Observable<EstadoSucursal[]>;

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    const endpoint = 'auth/login';
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data).pipe(
      catchError((error) => {
        console.error(error);
        return of(null);
      }),
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
  clients(pagina: number, filtros: ClienteFiltros = {}): Observable<any> {
    let params = new HttpParams().set('pagina', pagina.toString());

    if (Array.isArray(filtros.servicios) && filtros.servicios.length) {
      params = params.set('servicios', filtros.servicios.join(','));
    }

    const setNumberParam = (key: string, value?: number | null) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return;
      }
      params = params.set(key, value.toString());
    };

    setNumberParam('visitasMensualesMin', filtros.visitasMensualesMin ?? null);
    setNumberParam('visitasMensualesMax', filtros.visitasMensualesMax ?? null);
    setNumberParam(
      'visitasEmergenciaMin',
      filtros.visitasEmergenciaMin ?? null,
    );
    setNumberParam(
      'visitasEmergenciaMax',
      filtros.visitasEmergenciaMax ?? null,
    );

    const setBooleanParam = (key: string, value?: boolean | null) => {
      if (value === null || value === undefined) {
        return;
      }
      params = params.set(key, value ? 'true' : 'false');
    };

    setBooleanParam('esLead', filtros.esLead ?? null);
    setBooleanParam('tieneDatosBancarios', filtros.tieneDatosBancarios ?? null);

    return this.http.get<any>(`${this.url}/clientes`, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener clientes:', error);
        return throwError(() => error);
      }),
    );
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
      }),
    );
  }

  clientesBitacora(): Observable<any> {
    const endpoint = 'bitacoras/clientes';
    return this.getInformation(endpoint);
  }

  documentacionClientes(
    params: {
      pagina?: number;
      limite?: number;
      clienteId?: string;
      tipo?: string;
      buscar?: string;
    } = {},
  ): Observable<DocumentoClienteListado> {
    let httpParams = new HttpParams();

    if (params.pagina) {
      httpParams = httpParams.set('pagina', params.pagina.toString());
    }
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }
    if (params.clienteId && params.clienteId.trim().length) {
      httpParams = httpParams.set('clienteId', params.clienteId.trim());
    }
    if (params.tipo && params.tipo.trim().length) {
      httpParams = httpParams.set('tipo', params.tipo.trim());
    }
    if (params.buscar && params.buscar.trim().length) {
      httpParams = httpParams.set('buscar', params.buscar.trim());
    }

    return this.http
      .get<DocumentoClienteListado>(`${this.url}/documentacion`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener documentación de clientes:', error);
          return throwError(() => error);
        }),
      );
  }

  crearDocumentoCliente(payload: FormData): Observable<DocumentoCliente> {
    return this.http
      .post<DocumentoCliente>(`${this.url}/documentacion`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al crear documento de cliente:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarDocumentoCliente(id: number): Observable<{ mensaje: string }> {
    return this.http
      .delete<{ mensaje: string }>(`${this.url}/documentacion/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar documento de cliente:', error);
          return throwError(() => error);
        }),
      );
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
      }),
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
        }),
      );
    } else {
      // Si no es FormData, usamos el mÃ©todo postInformation normal
      return this.postInformation(datos, endpoint);
    }
  }

  // Sucursal
  sucursal(
    id: string,
    pagina: number,
    option: string,
    filtros?: EquipoFiltros,
  ): Observable<any> {
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
        params = params.set(
          'conRegistroFotografico',
          String(conRegistroFotografico),
        );
      }
    }

    return this.http.get<any>(`${this.url}/sucursal/${id}`, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud GET:', error);
        return throwError(() => error);
      }),
    );
  }

  // Obtener usuarios con filtros
  users(pagina: number, option?: string, buscar?: string): Observable<any> {
    let endpoint = `usuarios` + `?pagina=${pagina}`;
    if (option) {
      endpoint = endpoint + `&option=${option}`;
    }
    if (buscar) {
      endpoint = endpoint + `&buscar=${encodeURIComponent(buscar)}`;
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
    payload: { name?: string; dict?: string; campoIds?: number[] },
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
    campoIds: number[],
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
    }>,
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

  createDepartamentoEquipo(payload: {
    name: string;
  }): Observable<DepartamentoEquipo> {
    const endpoint = 'departamentos-equipos';
    return this.postInformation(payload, endpoint);
  }

  updateDepartamentoEquipo(
    id: number,
    payload: { name: string },
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
      }),
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
      }),
    );

    const equipos$ = this.equipmentsByCasaMatriz(id).pipe(
      catchError((error) => {
        console.error('Error al obtener equipos del cliente:', error);
        return of([] as Equipo[]);
      }),
    );

    return forkJoin({ detalle: detalle$, equipos: equipos$ }).pipe(
      map(({ detalle, equipos }) => {
        const clienteBase = detalle?.cliente as Cliente | undefined;
        const clienteDetalle: Cliente | null = clienteBase
          ? ({
              ...clienteBase,
              sucursales: Array.isArray(clienteBase.sucursales)
                ? clienteBase.sucursales.map((sucursal: any) => ({
                    ...sucursal,
                  }))
                : [],
            } as Cliente)
          : null;

        const equiposDesdeDetalle =
          this.extraerEquiposDeDetalle(clienteDetalle);
        const equiposNormalizados = this.unificarEquiposListas([
          equiposDesdeDetalle,
          equipos,
        ]);

        if (clienteDetalle && Array.isArray(clienteDetalle.sucursales)) {
          const conteoPorSucursal =
            this.contarEquiposPorSucursal(equiposNormalizados);
          clienteDetalle.sucursales = clienteDetalle.sucursales.map(
            (sucursal: any) => {
              const clave = String(sucursal.id ?? '');
              const conteo = conteoPorSucursal.get(clave);
              const existente =
                typeof sucursal.equiposCount === 'number'
                  ? Number(sucursal.equiposCount)
                  : undefined;
              return {
                ...sucursal,
                equiposCount:
                  existente !== undefined ? existente : (conteo ?? 0),
              };
            },
          );
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
      }),
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

  private unificarEquiposListas(
    listados: Array<Equipo[] | null | undefined>,
  ): Equipo[] {
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
      const sucursalId =
        (equipo as any)?.sucursalId ?? (equipo as any)?.sucursal?.id;
      if (sucursalId === undefined || sucursalId === null) {
        return;
      }
      const clave = String(sucursalId);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });

    return conteo;
  }

  private normalizarClaveEquipo(
    equipo: Equipo | null | undefined,
  ): string | null {
    if (!equipo) {
      return null;
    }

    const clave =
      (equipo.id !== undefined && equipo.id !== null ? equipo.id : undefined) ??
      (equipo.codigoId && String(equipo.codigoId).trim() !== ''
        ? equipo.codigoId
        : undefined) ??
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
      const stringValue =
        typeof value === 'string' ? value.trim() : String(value);
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

  tickets(params: Record<string, any> = {}): Observable<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      const stringValue =
        typeof value === 'string' ? value.trim() : String(value);
      if (stringValue !== '') {
        searchParams.append(key, stringValue);
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `tickets?${query}` : 'tickets';
    return this.getInformation(endpoint);
  }

  ticket(id: number): Observable<any> {
    const endpoint = `tickets/${id}`;
    return this.getInformation(endpoint);
  }

  eliminarBitacora(id: number): Observable<any> {
    const endpoint = `bitacoras/${id}`;
    return this.deleteInformation(endpoint);
  }

  eliminarTicket(id: number): Observable<any> {
    const endpoint = `tickets/${id}`;
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

  crearTicket(payload: any): Observable<any> {
    const endpoint = 'tickets';
    return this.postInformation(payload, endpoint);
  }

  actualizarBitacora(id: number, payload: any): Observable<any> {
    const endpoint = `bitacoras/${id}`;
    return this.putInformation(payload, endpoint);
  }

  actualizarTicket(id: number, payload: any): Observable<any> {
    const endpoint = `tickets/${id}`;
    return this.putInformation(payload, endpoint);
  }

  notificacionesListado(
    params: { soloNoLeidas?: boolean; limite?: number } = {},
  ): Observable<NotificacionListadoRespuesta> {
    let httpParams = new HttpParams();
    if (params.soloNoLeidas) {
      httpParams = httpParams.set('soloNoLeidas', 'true');
    }
    if (params.limite && params.limite > 0) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }

    return this.http
      .get<NotificacionListadoRespuesta>(`${this.url}/notificaciones`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener notificaciones:', error);
          return throwError(() => error);
        }),
      );
  }

  marcarNotificacionesLeidas(
    ids: number[],
  ): Observable<{ actualizadas: number }> {
    const payload = Array.isArray(ids) && ids.length ? { ids } : { ids: [] };
    return this.http
      .patch<{
        actualizadas: number;
      }>(`${this.url}/notificaciones/leidas`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al marcar notificaciones como leidas:', error);
          return throwError(() => error);
        }),
      );
  }

  marcarTodasNotificaciones(): Observable<{ actualizadas: number }> {
    return this.http
      .patch<{ actualizadas: number }>(`${this.url}/notificaciones/leidas`, {
        todas: true,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(
            'Error al marcar todas las notificaciones como leidas:',
            error,
          );
          return throwError(() => error);
        }),
      );
  }

  getProyectos(
    params: { pagina?: number; limite?: number; buscar?: string } = {},
  ): Observable<any> {
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
        }),
      );
  }

  getProyecto(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/proyectos/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener el proyecto:', error);
        return throwError(() => error);
      }),
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

  // Vehículos
  getVehiculos(
    params: { pagina?: number; limite?: number; buscar?: string } = {},
  ): Observable<VehiculoListadoResponse> {
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
      .get<VehiculoListadoResponse>(`${this.url}/vehiculos`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener vehículos:', error);
          return throwError(() => error);
        }),
      );
  }

  getVehiculo(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.url}/vehiculos/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener el vehículo:', error);
        return throwError(() => error);
      }),
    );
  }

  crearVehiculo(payload: FormData | any): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(`${this.url}/vehiculos`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al crear vehículo:', error);
        return throwError(() => error);
      }),
    );
  }

  actualizarVehiculo(
    id: number,
    payload: FormData | any,
  ): Observable<Vehiculo> {
    return this.http.put<Vehiculo>(`${this.url}/vehiculos/${id}`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar vehículo:', error);
        return throwError(() => error);
      }),
    );
  }

  eliminarVehiculo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/vehiculos/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al eliminar vehículo:', error);
        return throwError(() => error);
      }),
    );
  }

  crearVehiculoSalida(
    vehiculoId: number,
    payload: FormData | any,
  ): Observable<VehiculoSalida> {
    return this.http
      .post<VehiculoSalida>(
        `${this.url}/vehiculos/${vehiculoId}/salidas`,
        payload,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al registrar salida:', error);
          return throwError(() => error);
        }),
      );
  }

  actualizarVehiculoSalida(
    vehiculoId: number,
    salidaId: number,
    payload: FormData | any,
  ): Observable<VehiculoSalida> {
    return this.http
      .put<VehiculoSalida>(
        `${this.url}/vehiculos/${vehiculoId}/salidas/${salidaId}`,
        payload,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar salida:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarVehiculoSalida(
    vehiculoId: number,
    salidaId: number,
  ): Observable<any> {
    return this.http
      .delete<any>(`${this.url}/vehiculos/${vehiculoId}/salidas/${salidaId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar salida:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarVehiculoSalidaAdjunto(
    vehiculoId: number,
    salidaId: number,
    adjuntoId: number,
  ): Observable<any> {
    return this.http
      .delete<any>(
        `${this.url}/vehiculos/${vehiculoId}/salidas/${salidaId}/adjuntos/${adjuntoId}`,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar adjunto de salida:', error);
          return throwError(() => error);
        }),
      );
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
      }),
    );
  }

  // Obtener estados de sucursales
  getEstadosSucursal(): Observable<EstadoSucursal[]> {
    if (!this.estadosSucursalCache$) {
      const endpoint = 'estados-sucursales';
      this.estadosSucursalCache$ = this.getInformation(endpoint).pipe(
        map((respuesta) => (Array.isArray(respuesta) ? respuesta : [])),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.estadosSucursalCache$;
  }

  // Actualizar estado de sucursal
  actualizarEstadoSucursal(id: string, estado: string): Observable<any> {
    const endpoint = `actualizar-estado-sucursal/${id}`;
    return this.http.post<any>(`${this.url}/${endpoint}`, { estado }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar estado de la sucursal:', error);
        return throwError(() => error);
      }),
    );
  }

  // Metodos principales
  getInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.get<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud GET:', error);
        return throwError(() => error);
      }),
    );
  }

  postInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud POST:', error);
        return throwError(() => error);
      }),
    );
  }

  putInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.put<any>(url, data).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud PUT:', error);
        return throwError(() => error);
      }),
    );
  }

  deleteInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.delete<any>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la solicitud DELETE:', error);
        return throwError(() => error);
      }),
    );
  }

  // Consumo de imagenes GCS (Google Cloud Storage)
  signedUrl(fileName: string): Observable<string> {
    const apiUrl = `${this.url}/api/generar-url/${fileName}`;
    return this.http
      .get<{ signedUrl: string }>(apiUrl)
      .pipe(map((response) => response.signedUrl));
  }

  // Verificar si correo electronico existe en la cuenta
  verificarCorreoExistente(correo: string): Observable<boolean> {
    return this.http
      .get<{
        isTaken: boolean;
      }>(`${this.url}/verificar-correo?correo=${correo}`)
      .pipe(
        map((response) => {
          return response.isTaken;
        }),
      );
  }

  getLogs(): Observable<any> {
    const endpoint = 'logs';
    return this.getInformation(endpoint);
  }

  // =====================================================
  // Chat de Tickets
  // =====================================================

  getTicketTimeline(
    ticketId: number,
    params: { limite?: number } = {},
  ): Observable<any> {
    let httpParams = new HttpParams();
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }

    return this.http
      .get<any>(`${this.url}/tickets/${ticketId}/timeline`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener timeline del ticket:', error);
          return throwError(() => error);
        }),
      );
  }

  getTicketMensajes(
    ticketId: number,
    params: { pagina?: number; limite?: number } = {},
  ): Observable<any> {
    let httpParams = new HttpParams();
    if (params.pagina) {
      httpParams = httpParams.set('pagina', params.pagina.toString());
    }
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }

    return this.http
      .get<any>(`${this.url}/tickets/${ticketId}/chat`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener mensajes del ticket:', error);
          return throwError(() => error);
        }),
      );
  }

  enviarMensajeTicket(
    ticketId: number,
    mensaje: string,
    archivos?: File[],
  ): Observable<any> {
    const tieneArchivos = archivos && archivos.length > 0;

    if (tieneArchivos) {
      const formData = new FormData();
      formData.append('mensaje', mensaje);
      archivos.forEach((archivo) => {
        formData.append('files', archivo, archivo.name);
      });
      return this.http
        .post<any>(`${this.url}/tickets/${ticketId}/chat`, formData)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Error al enviar mensaje:', error);
            return throwError(() => error);
          }),
        );
    }

    return this.http
      .post<any>(`${this.url}/tickets/${ticketId}/chat`, { mensaje })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al enviar mensaje:', error);
          return throwError(() => error);
        }),
      );
  }

  marcarMensajesLeidosTicket(ticketId: number): Observable<any> {
    return this.http
      .post<any>(`${this.url}/tickets/${ticketId}/chat/leidos`, {})
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al marcar mensajes como leídos:', error);
          return throwError(() => error);
        }),
      );
  }

  getTicketActividad(
    ticketId: number,
    params: { pagina?: number; limite?: number } = {},
  ): Observable<any> {
    let httpParams = new HttpParams();
    if (params.pagina) {
      httpParams = httpParams.set('pagina', params.pagina.toString());
    }
    if (params.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }

    return this.http
      .get<any>(`${this.url}/tickets/${ticketId}/actividad`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener actividad del ticket:', error);
          return throwError(() => error);
        }),
      );
  }

  getMensajesNoLeidosPorTicket(): Observable<{ data: Record<number, number> }> {
    return this.http
      .get<{
        data: Record<number, number>;
      }>(`${this.url}/tickets/mensajes-no-leidos`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener mensajes no leídos:', error);
          return throwError(() => error);
        }),
      );
  }

  // ===============================================
  // Tags de clientes
  // ===============================================

  getTagsCliente(clienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/clientes/${clienteId}/tags`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener tags del cliente:', error);
        return of([]);
      }),
    );
  }

  crearTag(
    clienteId: string,
    tag: { nombre: string; color: string },
  ): Observable<any> {
    return this.http
      .post<any>(`${this.url}/clientes/${clienteId}/tags`, tag)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al crear tag:', error);
          return throwError(() => error);
        }),
      );
  }

  actualizarTag(
    clienteId: string,
    tagId: number,
    tag: { nombre?: string; color?: string },
  ): Observable<any> {
    return this.http
      .put<any>(`${this.url}/clientes/${clienteId}/tags/${tagId}`, tag)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar tag:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarTag(clienteId: string, tagId: number): Observable<any> {
    return this.http
      .delete<any>(`${this.url}/clientes/${clienteId}/tags/${tagId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar tag:', error);
          return throwError(() => error);
        }),
      );
  }

  // =====================================================
  // Biblioteca (Base de Conocimiento)
  // =====================================================

  getBibliotecaProyectos(
    params: {
      pagina?: number;
      limite?: number;
      buscar?: string;
      casaMatrizId?: string;
    } = {},
  ): Observable<BibliotecaListadoResponse> {
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
    if (params.casaMatrizId && params.casaMatrizId.trim().length) {
      httpParams = httpParams.set('casaMatrizId', params.casaMatrizId.trim());
    }

    return this.http
      .get<BibliotecaListadoResponse>(`${this.url}/biblioteca`, {
        params: httpParams,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener proyectos de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  getBibliotecaProyecto(id: number): Observable<BibliotecaProyecto> {
    return this.http
      .get<BibliotecaProyecto>(`${this.url}/biblioteca/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener proyecto de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  crearBibliotecaProyecto(payload: FormData): Observable<BibliotecaProyecto> {
    return this.http
      .post<BibliotecaProyecto>(`${this.url}/biblioteca`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al crear proyecto de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  actualizarBibliotecaProyecto(
    id: number,
    payload: FormData,
  ): Observable<BibliotecaProyecto> {
    return this.http
      .put<BibliotecaProyecto>(`${this.url}/biblioteca/${id}`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar proyecto de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarBibliotecaProyecto(id: number): Observable<{ mensaje: string }> {
    return this.http
      .delete<{ mensaje: string }>(`${this.url}/biblioteca/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar proyecto de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  agregarAdjuntosBiblioteca(id: number, payload: FormData): Observable<any> {
    return this.http
      .post<any>(`${this.url}/biblioteca/${id}/adjuntos`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al agregar adjuntos de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarAdjuntoBiblioteca(
    proyectoId: number,
    adjuntoId: number,
  ): Observable<{ mensaje: string }> {
    return this.http
      .delete<{
        mensaje: string;
      }>(`${this.url}/biblioteca/${proyectoId}/adjuntos/${adjuntoId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar adjunto de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  // =====================================================
  // Biblioteca - Categorías
  // =====================================================

  getBibliotecaCategorias(): Observable<BibliotecaCategoria[]> {
    return this.http
      .get<BibliotecaCategoria[]>(`${this.url}/biblioteca/categorias`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener categorías de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  crearBibliotecaCategoria(payload: {
    nombre: string;
    color: string;
    columnas: any[];
  }): Observable<BibliotecaCategoria> {
    return this.http
      .post<BibliotecaCategoria>(`${this.url}/biblioteca/categorias`, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al crear categoría de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  actualizarBibliotecaCategoria(
    id: number,
    payload: {
      nombre?: string;
      color?: string;
      columnas?: any[];
    },
  ): Observable<BibliotecaCategoria> {
    return this.http
      .put<BibliotecaCategoria>(
        `${this.url}/biblioteca/categorias/${id}`,
        payload,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar categoría de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }

  eliminarBibliotecaCategoria(id: number): Observable<{ mensaje: string }> {
    return this.http
      .delete<{ mensaje: string }>(`${this.url}/biblioteca/categorias/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar categoría de biblioteca:', error);
          return throwError(() => error);
        }),
      );
  }
}
