import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';

interface Token {
  id: number;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private key = 'token';

  constructor() { }

   guardarToken(token: string): void {
    localStorage.setItem(this.key, token);
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

  // Método para verificar la validez del token
  esTokenValido(): boolean {
    return !this.estaTokenExpirado();
  }

  // Método para cerrar sesión
  eliminarToken(): void {
    localStorage.removeItem(this.key);
  }
}
