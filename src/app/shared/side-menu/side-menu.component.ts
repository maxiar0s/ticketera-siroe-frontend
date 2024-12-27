import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Menus
import sideMenuJSON_Admin from './side-menu-options-admin.json';
import sideMenuJSON_Tecnico from './side-menu-options.json';
import sideLogoutMenuJSON from './side-menu-logout.json';

@Component({
  selector: 'shared-side-menu',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css'
})
export class SideMenuComponent {
  currentItem: string = "";
  currentSubItem: string = "";
  // public sideMenuJSON = sideMenuJSON_Admin;
  public sideMenuJSON = sideMenuJSON_Tecnico;
  public sideLogoutMenuJSON = sideLogoutMenuJSON;

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private location: Location
  ) {}

  ngOnInit():void {
    const path = this.location.path() == '' ? '/dashboard' : this.location.path();
    this.currentItem = path;
    this.currentSubItem = path;
  }

  activeItem(event: MouseEvent, subGrupo: any, route: string):void {
    const Element = event.currentTarget as HTMLAnchorElement;

    subGrupo.some((subItem: any) => {
      if(this.currentItem == subItem.route){
        console.log('asd');
        if(Element.classList.contains('open')){
          this.renderer.removeClass(Element, "open");
        }else{
          this.renderer.addClass(Element, "open");
        }
      }
    })

    this.currentSubItem = subGrupo[0].route;
    this.currentItem = route;
  }

  activeRoute(subItem: any): boolean {
    return subItem.some((subItem: any) => subItem.route == this.currentItem);
  }

  activeSubItem(route:string):void {
    this.currentSubItem =  route;
  }


  cerrarSesion():void {
    this.authService.eliminarToken();
  }
}
