import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = "https://app-soporte-siroe.vercel.app";

  constructor(
    private http: HttpClient,
  ) {}

  login(data: any):Observable<any> {
    const endpoint = 'login';
    const url = `${this.url}/${endpoint}`
    return this.http.post<any>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  // POST
  createClient(data: any):Observable<any> {
    const endpoint = 'ingresar-cliente';
    return this.postInformation(data, endpoint);
  }

  // GET
  clients():Observable<any> {
    const endpoint = 'clientes';
    return this.getInformation(endpoint);
  }

  sucursales(id: string):Observable<any> {
    const endpoint = `cliente/` + id + '/sucursales';
    return this.getInformation(endpoint);
  }

  sucursal(id: string):Observable<any> {
    const endpoint = `sucursal/` + id;
    return this.getInformation(endpoint);
  }

  equipmentsBySucursal(id: string):Observable<any> {
    const endpoint = `sucursal/` + id + `/equipos`;
    return this.getInformation(endpoint);
  }

  equipmentsByCasaMatriz(id: string):Observable<any> {
    const endpoint = `cliente/` + id + `/equipos`;
    return this.getInformation(endpoint);
  }

  // METHOD GET
  getInformation(endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.get<any>(url)
    .pipe(
      catchError(this.handleError)
    );
  }

  // METHOD POST
  postInformation(data: any, endpoint: string) {
    const url = `${this.url}/${endpoint}`;
    return this.http.post<any>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de Error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
