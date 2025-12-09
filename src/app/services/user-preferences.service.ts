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
   * @param tema - 'claro', 'oscuro', or 'sistema'
   */
  aplicarTema(tema: 'claro' | 'oscuro' | 'sistema'): void {
    // Remove previous listener if exists
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener(
        'change',
        this.handleSystemThemeChange
      );
    }

    if (tema === 'sistema') {
      // Follow system preference
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.aplicarTemaDelSistema(this.mediaQuery.matches);
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    } else {
      // Apply user-selected theme
      document.documentElement.setAttribute(
        'data-theme',
        tema === 'oscuro' ? 'dark' : 'light'
      );
    }
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
      // No user, apply system default
      this.aplicarTema('sistema');
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
