import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Menus
import menu_administrador from './menu-administrador.json';
import menu_tecnico from './menu-tecnico.json';
import menu_config from './menu-config.json';

@Component({
  selector: 'shared-side-menu',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css'
})
export class SideMenuComponent {
  public currentGroup: string = '';
  public currentSubGroup: string = '';

  // Menus
  public menu: any;
  public menuConfig = menu_config;

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private location: Location
  ) {}

  ngOnInit():void {
    if(this.authService.esAdministrador()) {
      this.menu = menu_administrador
    } else this.menu = menu_tecnico;

    const path = this.location.path();
    this.currentGroup = path;
    this.currentSubGroup = path;
  }

  cerrarSesion():void {
    this.authService.eliminarToken();
  }

  routeActive(event: MouseEvent, route: string):void {
    const Element = event.currentTarget as HTMLAnchorElement;

    if(this.currentGroup == route) {
      if(Element.classList.contains('active')) {
        this.renderer.removeClass(Element, "active");
      } else {
        this.renderer.addClass(Element, 'active');
      }
    }
    this.currentGroup = route;
  }

  activeGroup(route: any):boolean {
    return this.currentGroup == route;
  }

  activeSubGroup(route:string):void {
    this.currentSubGroup = route;
  }



  toggleSubItems(item: any): void {
    if (this.currentGroup === item.route) {
      // Si el grupo ya está activo, ciérralo
      item.isOpen = false;
      this.currentGroup = '';
    } else {
      // Abre el nuevo grupo y cierra los demás
      this.menu.forEach((i: { isOpen: boolean; }) => (i.isOpen = false));
      item.isOpen = true;
      this.currentGroup = item.route;
    }
  }
}
