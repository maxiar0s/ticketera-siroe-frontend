import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // private url = "https://app-soporte-siroe.vercel.app";
  private url = "http://localhost:3000";

  constructor(
    private http: HttpClient,
  ) {}

  login(data: any):Observable<any> {
    const endpoint = 'auth/login';
    const url = `${this.url}/${endpoint}`
    return this.http.post<any>(url, data)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  // POST
  createClient(data: any):Observable<any> {
    const endpoint = 'ingresar-cliente';
    return this.postInformation(data, endpoint);
  }

  createEquiptment(data: any):Observable<any> {
    const endpoint = 'ingresar-equipo';
    return this.postInformation(data, endpoint);
  }

  modifyEquiptment(data:any):Observable<any> {
    const { id } = data;
    const endpoint = 'modificar-equipo/' + id;
    return this.postInformation(data, endpoint);
  }

  // GET
  clients(pagina: number):Observable<any> {
    const endpoint = `clientes?pagina=${pagina}`;
    return this.getInformation(endpoint);
  }

  client(id: string):Observable<any> {
    const endpoint = 'cliente/'+id;
    return this.getInformation(endpoint);
  }

  sucursales(id: string, pagina: number, option: string):Observable<any> {
    if (option === 'Terminados') {
      const endpoint = `cliente/` + id + `/sucursales/terminados?pagina=${pagina}`;
      return this.getInformation(endpoint);
    }
    else if(option === 'Pendientes') {
      const endpoint = `cliente/` + id + `/sucursales/pendientes?pagina=${pagina}`;
      return this.getInformation(endpoint);
    } else {
      const endpoint = `cliente/` + id + `/sucursales?pagina=${pagina}`;
      return this.getInformation(endpoint);
    }
  }

  sucursalesPendientes(id: string):Observable<any> {
    const endpoint = `cliente/` + id + '/sucursales/pendientes';
    return this.getInformation(endpoint);
  }

  sucursalesTerminadas(id: string):Observable<any> {
    const endpoint = `cliente/` + id + '/sucursales/terminadas';
    return this.getInformation(endpoint);
  }

  sucursal(id: string):Observable<any> {
    const endpoint = `sucursal/` + id;
    return this.getInformation(endpoint);
  }

  equipmentsBySucursal(id: string, pagina: number, option: string):Observable<any> {
    if(option === 'Terminados') {
      const endpoint = `sucursal/` + id + `/equipos/terminados?pagina=${pagina}`;
      return this.getInformation(endpoint);
    }
    if(option === 'Pendientes') {
      const endpoint = `sucursal/` + id + `/equipos/pendientes?pagina=${pagina}`;
      return this.getInformation(endpoint);
    }
    else {
      const endpoint = `sucursal/` + id + `/equipos?pagina=${pagina}`;
      return this.getInformation(endpoint);
    }
  }

  equipmentsByCasaMatriz(id: string):Observable<any> {
    const endpoint = `cliente/` + id + `/equipos`;
    return this.getInformation(endpoint);
  }

  equiptment(id: number):Observable<any> {
    const endpoint = `equipo/`+ id;
    return this.getInformation(endpoint);
  }

  // Metodos principales
  getInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error(error);
        return of(null);
      })
    );
  }

  postInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
