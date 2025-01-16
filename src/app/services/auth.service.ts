import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';

interface Token {
  id:         number;
  iat:        number;
  exp:        number;
  tipoCuenta: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private key = 'token';
  userSigned: boolean = false;

  constructor() { }

  guardarToken(token: string): void {
    localStorage.setItem(this.key, token);
    this.userSigned = true;
  }

  // Obtener el token
  obtenerToken(): string | null {
    return localStorage.getItem(this.key);
  }

  // Decodificar el token
  decodificarToken(): Token | null {
    const token = this.obtenerToken();
    if (token) {
      try {
        console.log(jwtDecode<Token>(token));
        return jwtDecode<Token>(token);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null;
      }
    }
    return null;
  }

  // Verificar si el token ha expirado
  estaTokenExpirado(): boolean {
    const payload = this.decodificarToken();
    if (payload) {
      const tiempoActual = Math.floor(Date.now() / 1000);
      return payload.exp < tiempoActual;
    }
    // Si no hay token, es expirado
    return true;
  }

  // Metodo para verificar tipo de usuario
  esAdministrador(): boolean {
    const decodificado = this.decodificarToken();
    if(decodificado) {
      const { tipoCuenta } = decodificado;
      if(tipoCuenta == 1) return true;
      else return false;
    }
    else return false;
  }

  // Método para verificar la validez del token
  esTokenValido(): boolean {
    if(localStorage.getItem('token')) this.userSigned = true;
    return !this.estaTokenExpirado();
  }

  // Método para cerrar sesión
  eliminarToken(): void {
    console.log('eliminando token');
    localStorage.removeItem(this.key);
    this.userSigned = false;
  }
}
