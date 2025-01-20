import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

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

  createModifyBranch(data: any):Observable<any> {
    const endpoint = 'ingresar-sucursal';
    return this.postInformation(data, endpoint);
  }

  createModifyUser(data: any):Observable<any> {
    const endpoint = 'crear-modificar-cuenta';
    return this.postInformation(data, endpoint);
  }

    // Equiptment
  createEquiptment(data: any):Observable<any> {
    const endpoint = 'ingresar-equipo';
    return this.postInformation(data, endpoint);
  }
  modifyEquiptment(data:any):Observable<any> {
    let formValues: { [key: string]: any } = {};
    data.forEach((value: any, key: any) => {
      formValues[key] = value;
    });
    const { id } = formValues;
    const endpoint = 'modificar-equipo/' + id;
    return this.postInformation(data, endpoint);
  }
  createComment(data:any):Observable<any> {
    const { equipoId: id } = data;
    const endpoint = 'ingresar-observacion/' + id;
    return this.postInformation(data, endpoint);
  }

  // GET
  deleteUser(id: number):Observable<any> {
    const endpoint = `eliminar-cuenta/${id}`;
    return this.getInformation(endpoint);
  }

  deleteBranch(id: string):Observable<any> {
    const endpoint = `eliminar-sucursal/${id}`;
    return this.getInformation(endpoint);
  }

    // Casas Matricez
  clients(pagina: number):Observable<any> {
    const endpoint = `clientes?pagina=${pagina}`;
    return this.getInformation(endpoint);
  }

  client(id: string, pagina: number, option: string):Observable<any> {
    let endpoint = 'cliente/'+id+`?pagina=${pagina}`;
    if(option) {
      endpoint = 'cliente/'+id+`?pagina=${pagina}&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

    // Sucursal
  sucursal(id: string, pagina: number, option: string):Observable<any> {
    let endpoint = `sucursal/`+id+`?pagina=${pagina}`;
    if(option) {
      endpoint = `sucursal/`+id+`?pagina=${pagina}&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

    // Crear o modificar usuario
  users(pagina: number, option: string):Observable<any> {
    let endpoint = `usuarios`+`?pagina=${pagina}`;
    if(option) {
      endpoint = endpoint+`&option=${option}`;
    }
    return this.getInformation(endpoint);
  }

  typeEquipments():Observable<any> {
    const endpoint = 'tipos-equipos';
    return this.getInformation(endpoint);
  }

  formEquipment(tipoEquipoId: string):Observable<any> {
    const endpoint = `obtener-formulario/` + tipoEquipoId;
    return this.getInformation(endpoint);
  }

  equipmentsByCasaMatriz(id: string):Observable<any> {
    const endpoint = `cliente/` + id + `/equipos`;
    return this.getInformation(endpoint);
  }

    // Obtener equipo por ID
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

  // Consumo de imagenes GCS (Google Cloud Storage)
  signedUrl(fileName: string):Observable<any> {
    const apiUrl = `${this.url}/api/generar-url/${fileName}`;
    return this.http.get<{ signedUrl: string }>(apiUrl).pipe(
      map((response) => response.signedUrl)
    );
  }

  // Verificar si correo electronico existe en la cuenta
  verificarCorreoExistente(correo: string): Observable<boolean> {
    return this.http.get<{ isTaken: boolean }>(`${this.url}/verificar-correo?correo=${correo}`).pipe(
      map(response => {
        return response.isTaken;
      }),
    );
  }
}
