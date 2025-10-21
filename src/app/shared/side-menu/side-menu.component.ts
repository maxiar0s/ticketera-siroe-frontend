import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Menus
import menu_administrador from './menu-administrador.json';
import menu_tecnico from './menu-tecnico.json';
import menu_cliente from './menu-cliente.json';
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
  public menu: any;
  public menuConfig = menu_config;
  public logoRoute: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private location: Location
  ) {}

  private normalizeRoute(route: string | undefined | null): string {
    if (!route) {
      return '';
    }
    return route.replace(/^\//, '');
  }

  ngOnInit(): void {
    if (this.authService.esAdministrador()) {
      this.menu = menu_administrador;
      this.logoRoute = '/dashboard';
    } else if (this.authService.esCliente()) {
      this.menu = menu_cliente;
      this.logoRoute = '/dashboard-cliente';
    } else {
      this.menu = menu_tecnico;
      this.logoRoute = '/dashboard';
    }

    const path = this.location.path();
    const normalizedPath = this.normalizeRoute(path);

    let matchedRoute: string | null = null;

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
