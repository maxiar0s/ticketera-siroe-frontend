import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

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

  ngOnInit() {
    if(localStorage.getItem(this.key)) this.userSigned = true;
    else this.userSigned = false;
  }

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

  obtenerTipoCuenta(): number | null {
    const decodificado = this.decodificarToken();
    if (decodificado) {
      return decodificado.tipoCuenta;
    }
    return null;
  }

  // Metodo para verificar tipo de usuario
  esAdministrador(): boolean {
    return this.obtenerTipoCuenta() === 1;
  }

  esTecnico(): boolean {
    return this.obtenerTipoCuenta() === 2;
  }

  esMesaAyuda(): boolean {
    return this.obtenerTipoCuenta() === 3;
  }

  esCliente(): boolean {
    return this.obtenerTipoCuenta() === 4;
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
