import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  obtenerIniciales,
  generarColorDesdeTexto,
} from '../../utils/avatar.util';
import { NotificationService } from '../../services/notification.service';
import { Notificacion } from '../../interfaces/notificacion.interface';
import { FEATURES } from '../../config/features';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'shared-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('searchBar') searchBar!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchLabel') searchLabel!: ElementRef<HTMLLabelElement>;

  public title = this.signalService.getDataSignal();
  public isExpanded = false;
  public avatarIniciales = '?';
  public avatarColor = 'var(--color-primary)';
  public unreadCount = 0;
  public popupVisible = false;
  public notificaciones: Notificacion[] = [];
  public loadingNotificaciones = false;
  readonly features = FEATURES;

  private readonly destroyed$ = new Subject<void>();

  constructor(
    private signalService: SignalService,
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
    this.notificationService.cargarNotificaciones();
    this.notificationService.notificaciones$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((lista) => {
        this.notificaciones = lista;
      });
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((total) => {
        this.unreadCount = total;
      });
    this.notificationService.popupVisible$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((visible) => {
        this.popupVisible = visible;
      });
    this.notificationService.loading$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((loading) => {
        this.loadingNotificaciones = loading;
      });
  }

  ngAfterViewInit(): void {
    if (this.searchLabel && this.searchLabel.nativeElement) {
      this.searchLabel.nativeElement.addEventListener(
        'click',
        (event: Event) => {
          if (window.innerWidth <= 800 && !this.isExpanded) {
            event.preventDefault();
            this.toggleSearchBar();
          }
        }
      );
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

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private cargarPerfil(): void {
    const tokenValido = !this.authService.estaTokenExpirado();
    if (!tokenValido) {
      return;
    }

    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        this.avatarIniciales = obtenerIniciales(
          perfil?.name ?? perfil?.email ?? ''
        );
        this.avatarColor = generarColorDesdeTexto(
          perfil?.name ?? perfil?.email ?? ''
        );
      },
      error: () => {
        this.avatarIniciales = '?';
        this.avatarColor = 'var(--color-primary)';
      },
    });
  }

  toggleNotifications(): void {
    if (!this.popupVisible) {
      this.notificationService.refrescar();
    }
    this.notificationService.togglePopup();
  }

  closeNotifications(): void {
    this.notificationService.cerrarPopup();
  }

  markAllRead(): void {
    this.notificationService.marcarTodasComoLeidas();
  }

  onNotificationClick(notificacion: Notificacion): void {
    if (!notificacion) {
      return;
    }

    if (!notificacion.leida) {
      this.notificationService.marcarComoLeidas([notificacion.id]);
    }

    if (
      notificacion.referenciaTipo === 'bitacora' &&
      (notificacion.referenciaId || notificacion.metadata?.bitacoraId)
    ) {
      const destinoId =
        notificacion.referenciaId ?? notificacion.metadata?.bitacoraId;
      this.router.navigate(['/bitacoras'], {
        queryParams: { bitacoraId: destinoId },
        state: {
          notificacionId: notificacion.id,
        },
      });
      this.notificationService.cerrarPopup();
      return;
    }

    if (
      notificacion.referenciaTipo === 'ticket' &&
      (notificacion.referenciaId || notificacion.metadata?.ticketId)
    ) {
      const destinoId =
        notificacion.referenciaId ?? notificacion.metadata?.ticketId;
      this.router.navigate(['/tickets'], {
        queryParams: { ticketId: destinoId },
        state: {
          ticketId: destinoId,
          notificacionId: notificacion.id,
        },
      });
      this.notificationService.cerrarPopup();
    }
  }

  obtenerDetalleNotificacion(notificacion: Notificacion): string {
    const cliente = notificacion.metadata?.cliente;
    const titulo = notificacion.metadata?.titulo ?? null;
    if (cliente && titulo) {
      return `${cliente} · ${titulo}`;
    }
    if (cliente) {
      return cliente;
    }
    return notificacion.mensaje;
  }
}
