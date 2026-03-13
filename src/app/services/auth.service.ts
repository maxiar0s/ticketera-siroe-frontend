import { Injectable, computed, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { ModuleAccessService } from './module-access.service';

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
  private readonly key = 'token';
  private readonly tokenSignal = signal<string | null>(this.obtenerTokenDeStorage());
  private readonly decodedTokenSignal = computed<Token | null>(() => {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    try {
      return jwtDecode<Token>(token);
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  });

  private readonly storageListener = (event: StorageEvent) => {
    if (event.key === this.key) {
      this.tokenSignal.set(event.newValue);
    }
  };

  constructor(private moduleAccessService: ModuleAccessService) {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.storageListener);
    }
  }

  get userSigned(): boolean {
    return this.esTokenValido();
  }

  guardarToken(token: string): void {
    localStorage.setItem(this.key, token);
    this.tokenSignal.set(token);
    this.moduleAccessService.clear();
  }

  obtenerToken(): string | null {
    return this.tokenSignal();
  }

  decodificarToken(): Token | null {
    return this.decodedTokenSignal();
  }

  estaTokenExpirado(): boolean {
    const payload = this.decodedTokenSignal();
    if (payload) {
      const tiempoActual = Math.floor(Date.now() / 1000);
      return payload.exp < tiempoActual;
    }
    return true;
  }

  obtenerTipoCuenta(): number | null {
    const decodificado = this.decodificarToken();
    if (decodificado) {
      return decodificado.tipoCuenta;
    }
    return null;
  }

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

  esComercial(): boolean {
    return this.obtenerTipoCuenta() === 5;
  }

  esTokenValido(): boolean {
    return !!this.obtenerToken() && !this.estaTokenExpirado();
  }

  eliminarToken(): void {
    localStorage.removeItem(this.key);
    this.tokenSignal.set(null);
    this.moduleAccessService.clear();
  }

  private obtenerTokenDeStorage(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null;
  }
}
