import { CommonModule, Location } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import sideMenuJSON from './side-menu-options.json'
import sideLogoutMenuJSON from './side-menu-logout.json'

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
  public sideMenuJSON = sideMenuJSON;
  public sideLogoutMenuJSON = sideLogoutMenuJSON;

  constructor(private renderer: Renderer2, private router: Router, private location: Location) {}

  ngOnInit(): void {
    const path = this.location.path();
    this.currentGroup = path;
    this.currentSubGroup = path;
  }

  routeActive(event: MouseEvent, route: string):void {
    const Element = event.currentTarget as HTMLAnchorElement;

    if(this.currentGroup == route) {
      if(Element.classList.contains('open')) {
        this.renderer.removeClass(Element, "open");
      } else {
        this.renderer.addClass(Element, 'open');
      }
    }
    this.currentGroup = route;
  }

  activeGroup(route: any): boolean {
    return this.currentGroup == route;
  }

  activeSubGroup(route:string): void {
    this.currentSubGroup =  route;
  }
}
