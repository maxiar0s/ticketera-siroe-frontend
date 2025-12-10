import { Injectable } from '@angular/core';

export interface PreferenciasUsuario {
  tema: 'claro' | 'oscuro';
  idioma: 'es' | 'en';
  notificaciones: boolean;
  newsletter: boolean;
}

const PREFERENCIAS_POR_DEFECTO: PreferenciasUsuario = {
  tema: 'claro',
  idioma: 'es',
  notificaciones: true,
  newsletter: false,
};

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private mediaQuery: MediaQueryList | null = null;

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

  guardarPreferencias(
    id: string | number,
    preferencias: PreferenciasUsuario
  ): void {
    localStorage.setItem(this.construirKey(id), JSON.stringify(preferencias));
  }

  /**
   * Applies theme to the document based on preference.
   * @param tema - 'claro' or 'oscuro'
   */
  aplicarTema(tema: 'claro' | 'oscuro'): void {
    // Remove previous listener if exists
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener(
        'change',
        this.handleSystemThemeChange
      );
      this.mediaQuery = null;
    }

    // Apply user-selected theme
    document.documentElement.setAttribute(
      'data-theme',
      tema === 'oscuro' ? 'dark' : 'light'
    );
  }

  /**
   * Initialize theme on app startup.
   * @param userId - User ID to load preferences for, or null for default
   */
  inicializarTema(userId: string | number | null): void {
    if (userId !== null) {
      const preferencias = this.obtenerPreferencias(userId);
      this.aplicarTema(preferencias.tema);
    } else {
      // No user, apply light theme as default
      this.aplicarTema('claro');
    }
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent): void => {
    this.aplicarTemaDelSistema(e.matches);
  };

  private aplicarTemaDelSistema(prefersDark: boolean): void {
    document.documentElement.setAttribute(
      'data-theme',
      prefersDark ? 'dark' : 'light'
    );
  }
}
