import {
  Component,
  HostListener,
  Inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from './shared/side-menu/side-menu.component';
import { TopBarComponent } from './shared/top-bar/top-bar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UserPreferencesService } from './services/user-preferences.service';
import { Title } from '@angular/platform-browser';
import { BRAND } from './config/branding';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SideMenuComponent, TopBarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = BRAND.appTitle;
  isTabletViewport = false;
  isMobileMenuOpen = false;

  constructor(
    public authService: AuthService,
    private titleService: Title,
    private renderer: Renderer2,
    private preferenciasService: UserPreferencesService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.titleService.setTitle(BRAND.appTitle);
    this.setFavicon(BRAND.favicon);
  }

  ngOnInit(): void {
    // Initialize theme based on user preferences
    const token = this.authService.decodificarToken();
    const userId = token?.id ?? null;
    this.preferenciasService.inicializarTema(userId);
    this.updateViewportState();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  toggleMobileMenu(): void {
    if (!this.isTabletViewport) {
      return;
    }
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    if (!this.isTabletViewport) {
      return;
    }
    this.isMobileMenuOpen = false;
  }

  handleContentClick(event: MouseEvent): void {
    if (!this.isTabletViewport || !this.isMobileMenuOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('shared-top-bar')) {
      return;
    }

    this.closeMobileMenu();
  }

  private updateViewportState(): void {
    this.isTabletViewport = window.innerWidth <= 1024;
    if (!this.isTabletViewport) {
      this.isMobileMenuOpen = false;
    }
  }

  private setFavicon(faviconUrl: string): void {
    if (!faviconUrl) {
      return;
    }
    const head = this.document.querySelector('head');
    if (!head) {
      return;
    }

    // Reutilizamos si existe, si no lo creamos
    let link: HTMLLinkElement | null = head.querySelector('link[rel*="icon"]');
    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'icon');
      this.renderer.appendChild(head, link);
    }

    this.renderer.setAttribute(link, 'href', faviconUrl);
  }
}
