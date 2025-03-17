import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SignalService } from '../../services/signal.service';

@Component({
  selector: 'shared-top-bar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent implements AfterViewInit {
  @ViewChild('searchBar') searchBar!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchLabel') searchLabel!: ElementRef<HTMLLabelElement>;

  public title = this.signalService.getDataSignal();
  public isExpanded = false;

  constructor(private signalService: SignalService) {}

  ngAfterViewInit(): void {
    // Configurar el evento de clic para la lupa
    if (this.searchLabel && this.searchLabel.nativeElement) {
      this.searchLabel.nativeElement.addEventListener('click', (e: Event) => {
        // Solo activar si está en modo móvil
        if (window.innerWidth <= 800) {
          if (!this.isExpanded) {
            e.preventDefault();
            this.toggleSearchBar();
          }
        }
      });
    }
  }

  // Función para expandir/colapsar la barra de búsqueda
  toggleSearchBar(): void {
    this.isExpanded = !this.isExpanded;

    if (this.searchBar && this.searchBar.nativeElement) {
      if (this.isExpanded) {
        this.searchBar.nativeElement.classList.add('expanded');
        // Enfocar el input después de la transición
        setTimeout(() => {
          if (this.searchInput && this.searchInput.nativeElement) {
            this.searchInput.nativeElement.focus();
          }
        }, 300);
      } else {
        this.searchBar.nativeElement.classList.remove('expanded');
      }
    }
  }

  // Escuchar clics en el documento para cerrar la barra de búsqueda
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (window.innerWidth <= 800 &&
        this.isExpanded &&
        this.searchBar &&
        !this.searchBar.nativeElement.contains(event.target as Node)) {
      this.toggleSearchBar();
    }
  }

  // Escuchar teclas para cerrar con Escape
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isExpanded) {
      this.toggleSearchBar();
    }
  }
}
