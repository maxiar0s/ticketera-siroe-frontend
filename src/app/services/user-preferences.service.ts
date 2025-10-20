import { Injectable } from '@angular/core';

export interface PreferenciasUsuario {
  tema: 'claro' | 'oscuro' | 'sistema';
  idioma: 'es' | 'en';
  notificaciones: boolean;
  newsletter: boolean;
}

const PREFERENCIAS_POR_DEFECTO: PreferenciasUsuario = {
  tema: 'sistema',
  idioma: 'es',
  notificaciones: true,
  newsletter: false,
};

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private construirKey(id: string | number): string {
    return `preferencias-${id}`;
  }

  obtenerPreferencias(id: string | number): PreferenciasUsuario {
    const guardado = localStorage.getItem(this.construirKey(id));
    if (!guardado) {
      return { ...PREFERENCIAS_POR_DEFECTO };
    }

    try {
      const parsed = JSON.parse(guardado) as Partial<PreferenciasUsuario>;
      return {
        ...PREFERENCIAS_POR_DEFECTO,
        ...parsed,
      };
    } catch (_error) {
      return { ...PREFERENCIAS_POR_DEFECTO };
    }
  }

  guardarPreferencias(id: string | number, preferencias: PreferenciasUsuario): void {
    localStorage.setItem(this.construirKey(id), JSON.stringify(preferencias));
  }
}

