import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SideMenuComponent } from './shared/side-menu/side-menu.component';
import { TopBarComponent } from './shared/top-bar/top-bar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SideMenuComponent, TopBarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'front-siroe-soporte';

  constructor(
    public authService: AuthService,
    private router: Router) {
  }
}
