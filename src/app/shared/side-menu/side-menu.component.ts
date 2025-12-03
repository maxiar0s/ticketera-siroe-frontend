import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { BRAND } from '../../config/branding';
import { MODULES } from '../../config/modules';

// Menus
import menu_administrador from './menu-administrador.json';
import menu_tecnico from './menu-tecnico.json';
import menu_cliente from './menu-cliente.json';
import menu_comercial from './menu-comercial.json';
import menu_config from './menu-config.json';

@Component({
  selector: 'shared-side-menu',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css',
})
export class SideMenuComponent {
  public currentGroup: string = '';
  public currentSubGroup: string = '';

  // Menus
  public menu: any[] = [];
  public menuConfig = menu_config;
  public logoRoute: string = '/dashboard';
  public brand = BRAND;

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private location: Location,
    private apiService: ApiService,
    private router: Router
  ) {}

  private normalizeRoute(route: string | undefined | null): string {
    if (!route) {
      return '';
    }
    return route.replace(/^\//, '');
  }

  ngOnInit(): void {
    if (this.authService.esAdministrador()) {
      this.menu = this.clonarMenu(menu_administrador);
      this.logoRoute = '/dashboard';
    } else if (this.authService.esCliente()) {
      this.menu = this.clonarMenu(menu_cliente);
      this.logoRoute = '/dashboard-cliente';
    } else if (this.authService.esComercial()) {
      this.menu = this.clonarMenu(menu_comercial);
      this.logoRoute = '/dashboard';
    } else {
      this.menu = this.clonarMenu(menu_tecnico);
      this.logoRoute = '/dashboard';
    }

    this.sincronizarSeleccionConRuta(this.location.path());

    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        const tieneTickets =
          !!perfil?.haveTickets ||
          this.authService.esAdministrador() ||
          this.authService.esTecnico() ||
          this.authService.esComercial();
        this.ajustarMenuPorTickets(tieneTickets, this.location.path());
      },
      error: () => {
        const fallbackTickets =
          this.authService.esAdministrador() ||
          this.authService.esTecnico() ||
          this.authService.esComercial();
        this.ajustarMenuPorTickets(fallbackTickets, this.location.path());
      },
    });
  }

  private clonarMenu(base: any[]): any[] {
    const menu = JSON.parse(JSON.stringify(base ?? []));
    return menu.filter((item: any) => {
      // Si el item tiene una propiedad 'module' definida en el JSON (o inferida), filtramos
      // Pero como los JSON de menú no tienen la propiedad 'module', podemos usar la ruta para mapear
      // O mejor, podemos agregar la propiedad 'module' a los JSON de menú si fuera necesario.
      // Por ahora, vamos a inferir el módulo basado en la ruta, similar a como lo hicimos en las rutas.

      const route = this.normalizeRoute(item.route);
      let moduleKey: keyof typeof MODULES | undefined;

      // Mapeo simple de rutas a módulos (debe coincidir con app.routes.ts)
      if (route === 'dashboard') moduleKey = 'dashboard';
      else if (route === 'dashboard-cliente') moduleKey = 'dashboardCliente';
      else if (route === 'clientes') moduleKey = 'clientes';
      else if (route === 'documentacion') moduleKey = 'documentacion';
      else if (route === 'bitacora' || route === 'bitacoras')
        moduleKey = 'bitacora';
      else if (route === 'tickets') moduleKey = 'tickets';
      else if (route === 'proyectos') moduleKey = 'proyectos';
      else if (route === 'vehiculos') moduleKey = 'vehiculos';
      else if (route === 'opciones') moduleKey = 'opciones';
      else if (route === 'perfil') moduleKey = 'perfil';
      else if (route === 'admin/usuarios') moduleKey = 'adminUsuarios';
      else if (route === 'admin/tipos-equipos') moduleKey = 'adminTiposEquipos';

      // Si encontramos un key y el módulo está desactivado, lo filtramos
      if (moduleKey && MODULES[moduleKey] === false) {
        return false;
      }

      return true;
    });
  }

  private sincronizarSeleccionConRuta(path: string): void {
    const normalizedPath = this.normalizeRoute(path);
    let matchedRoute: string | null = null;

    this.menu?.forEach((item) => {
      if (typeof item.isOpen === 'boolean') {
        item.isOpen = false;
      }
    });

    this.currentGroup = '';
    this.currentSubGroup = '';

    for (const item of this.menu ?? []) {
      if (this.normalizeRoute(item.route) === normalizedPath) {
        matchedRoute = item.route;
        break;
      }

      if (Array.isArray(item.subItem) && item.subItem.length) {
        const subMatch = item.subItem.find(
          (sub: any) => this.normalizeRoute(sub.route) === normalizedPath
        );

        if (subMatch) {
          matchedRoute = item.route;
          item.isOpen = true;
          this.currentSubGroup = subMatch.route;
          break;
        }
      }
    }

    if (matchedRoute) {
      this.currentGroup = matchedRoute;
      if (!this.currentSubGroup) {
        this.currentSubGroup = matchedRoute;
      }
    } else if (this.menu?.length) {
      this.currentGroup = this.menu[0].route;
      this.currentSubGroup = this.menu[0].route;
    }
  }

  private ajustarMenuPorTickets(
    tieneTickets: boolean,
    currentPath: string
  ): void {
    const ticketIndex = this.menu.findIndex(
      (item) => this.normalizeRoute(item.route) === 'tickets'
    );

    if (!tieneTickets && ticketIndex !== -1) {
      this.menu.splice(ticketIndex, 1);
      this.sincronizarSeleccionConRuta(this.location.path());
      return;
    }

    this.sincronizarSeleccionConRuta(this.location.path());
  }

  cerrarSesion(): void {
    this.authService.eliminarToken();
  }

  routeActive(event: MouseEvent, route: string): void {
    const element = event.currentTarget as HTMLAnchorElement;

    if (this.currentGroup === route) {
      if (element.classList.contains('active')) {
        this.renderer.removeClass(element, 'active');
      } else {
        this.renderer.addClass(element, 'active');
      }
    }
    this.currentGroup = route;
    this.currentSubGroup = route;
  }

  activeGroup(route: any): boolean {
    return (
      this.normalizeRoute(this.currentGroup) === this.normalizeRoute(route)
    );
  }

  activeSubGroup(route: string): void {
    this.currentSubGroup = route;
  }

  toggleSubItems(item: any): void {
    const hasSubItems = Array.isArray(item.subItem) && item.subItem.length > 0;

    if (this.currentGroup === item.route) {
      if (hasSubItems) {
        item.isOpen = !item.isOpen;
      }
      this.currentGroup = item.route;
      this.currentSubGroup = item.route;
      return;
    }

    this.menu.forEach((i: { isOpen: boolean }) => {
      if (typeof i.isOpen === 'boolean') {
        i.isOpen = false;
      }
    });

    if (hasSubItems) {
      item.isOpen = true;
    }

    this.currentGroup = item.route;
    this.currentSubGroup = item.route;
  }
}
