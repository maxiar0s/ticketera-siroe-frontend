import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

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
    return JSON.parse(JSON.stringify(base ?? []));
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

  private ajustarMenuPorTickets(tieneTickets: boolean, currentPath: string): void {
    const index = this.menu.findIndex(
      (item) => this.normalizeRoute(item.route) === 'bitacora'
    );

    if (index === -1) {
      return;
    }

    if (!tieneTickets && this.authService.esCliente()) {
      this.menu.splice(index, 1);
      const destino = this.logoRoute || '/dashboard';
      const normalizedCurrent = this.normalizeRoute(currentPath);
      if (normalizedCurrent === 'bitacora') {
        this.router.navigate([destino]).finally(() => {
          this.sincronizarSeleccionConRuta(this.location.path());
        });
      } else {
        this.sincronizarSeleccionConRuta(this.location.path());
      }
      return;
    }

    if (tieneTickets) {
      this.menu[index] = {
        ...this.menu[index],
        nombre: 'Bitacora / Tickets',
      };
      this.sincronizarSeleccionConRuta(this.location.path());
    }
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
    return this.normalizeRoute(this.currentGroup) === this.normalizeRoute(route);
  }

  activeSubGroup(route: string): void {
    this.currentSubGroup = route;
  }

  toggleSubItems(item: any): void {
    if (this.currentGroup === item.route) {
      item.isOpen = false;
      this.currentGroup = '';
      this.currentSubGroup = '';
    } else {
      this.menu.forEach((i: { isOpen: boolean }) => (i.isOpen = false));
      item.isOpen = true;
      this.currentGroup = item.route;
      this.currentSubGroup = item.route;
    }
  }
}
