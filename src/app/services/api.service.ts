import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = "https://app-soporte-siroe.vercel.app";

  constructor(
    private http: HttpClient
  ) {}

  login(data: any):Observable<any> {
    const endpoint = 'login';
    const url = `${this.url}/${endpoint}`
    return this.http.post<any>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }


  createClient(data: any):Observable<any> {
    const endpoint = 'crear-cliente';
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
