import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { obtenerIniciales, generarColorDesdeTexto } from '../../utils/avatar.util';

@Component({
  selector: 'shared-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent implements AfterViewInit, OnInit {
  @ViewChild('searchBar') searchBar!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchLabel') searchLabel!: ElementRef<HTMLLabelElement>;

  public title = this.signalService.getDataSignal();
  public isExpanded = false;
  public avatarIniciales = '?';
  public avatarColor = '#b71653';

  constructor(
    private signalService: SignalService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  ngAfterViewInit(): void {
    if (this.searchLabel && this.searchLabel.nativeElement) {
      this.searchLabel.nativeElement.addEventListener('click', (event: Event) => {
        if (window.innerWidth <= 800 && !this.isExpanded) {
          event.preventDefault();
          this.toggleSearchBar();
        }
      });
    }
  }

  toggleSearchBar(): void {
    this.isExpanded = !this.isExpanded;

    if (this.searchBar?.nativeElement) {
      if (this.isExpanded) {
        this.searchBar.nativeElement.classList.add('expanded');
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 300);
      } else {
        this.searchBar.nativeElement.classList.remove('expanded');
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      window.innerWidth <= 800 &&
      this.isExpanded &&
      this.searchBar &&
      !this.searchBar.nativeElement.contains(event.target as Node)
    ) {
      this.toggleSearchBar();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isExpanded) {
      this.toggleSearchBar();
    }
  }

  private cargarPerfil(): void {
    const tokenValido = !this.authService.estaTokenExpirado();
    if (!tokenValido) {
      return;
    }

    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        this.avatarIniciales = obtenerIniciales(perfil?.name ?? perfil?.email ?? '');
        this.avatarColor = generarColorDesdeTexto(perfil?.name ?? perfil?.email ?? '');
      },
      error: () => {
        this.avatarIniciales = '?';
        this.avatarColor = '#b71653';
      },
    });
  }
}
