import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  //private url = 'http://167.71.172.190:3000';
  //private url = 'https://app-soporte-siroe.vercel.app';
  private url = 'http://localhost:3000';

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

  client(id: string, pagina: number, option: string): Observable<any> {
    let endpoint = 'cliente/' + id + `?pagina=${pagina}`;
    if (option) {
      endpoint = 'cliente/' + id + `?pagina=${pagina}&option=${option}`;
    }
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
      // Si no es FormData, usamos el método postInformation normal
      return this.postInformation(datos, endpoint);
    }
  }

  // Sucursal
  sucursal(id: string, pagina: number, option: string): Observable<any> {
    let endpoint = `sucursal/` + id + `?pagina=${pagina}&sort=asc`;
    if (option) {
      endpoint =
        `sucursal/` + id + `?pagina=${pagina}&option=${option}&sort=asc`;
    }
    return this.getInformation(endpoint);
  }

  // Crear o modificar usuario
  users(pagina: number, option: string): Observable<any> {
    let endpoint = `usuarios` + `?pagina=${pagina}`;
    if (option) {
      endpoint = endpoint + `&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

  typeEquipments(): Observable<any> {
    const endpoint = 'tipos-equipos';
    return this.getInformation(endpoint);
  }

  formEquipment(tipoEquipoId: string): Observable<any> {
    const endpoint = `obtener-formulario/` + tipoEquipoId;
    return this.getInformation(endpoint);
  }

  equipmentsByCasaMatriz(id: string): Observable<any> {
    const endpoint = `cliente/` + id + `/equipos`;
    return this.getInformation(endpoint);
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


