import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
import { finalize, takeUntil } from 'rxjs/operators';

interface AgentChatMessage {
  role: 'agent' | 'user';
  text: string;
  sources?: AgentChatSource[];
  actions?: AgentChatAction[];
}

interface AgentChatSource {
  label: string;
  type: 'external' | 'route';
  href?: string;
  route?: string;
  queryParams?: Record<string, string | number>;
}

type AgentChatAction = 'open_create_ticket';

@Component({
  selector: 'shared-top-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() showMenuToggle = false;
  @Input() isMenuOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  @ViewChild('searchBar') searchBar!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchLabel') searchLabel!: ElementRef<HTMLLabelElement>;
  @ViewChild('agentChatInput') agentChatInput?: ElementRef<HTMLInputElement>;

  public title = this.signalService.getDataSignal();
  public isExpanded = false;
  public avatarIniciales = '?';
  public avatarColor = 'var(--color-primary)';
  public unreadCount = 0;
  public popupVisible = false;
  public notificaciones: Notificacion[] = [];
  public loadingNotificaciones = false;
  public agentPopupVisible = false;
  public chatDraft = '';
  public isSendingAgentMessage = false;
  public chatMessages: AgentChatMessage[] = [
    {
      role: 'agent',
      text: 'Hola, soy tu agente SIROE. Estoy listo para ayudarte con consultas de soporte.',
    },
  ];
  readonly features = FEATURES;
  private readonly agentConversationId = `topbar-${Date.now()}`;

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
    if (event.key === 'Escape' && this.agentPopupVisible) {
      this.closeAgentChat();
      return;
    }

    if (event.key === 'Escape' && this.popupVisible) {
      this.closeNotifications();
      return;
    }

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
    if (this.agentPopupVisible) {
      this.closeAgentChat();
    }

    if (!this.popupVisible) {
      this.notificationService.refrescar();
    }
    this.notificationService.togglePopup();
  }

  toggleAgentChat(): void {
    if (this.popupVisible) {
      this.closeNotifications();
    }

    this.agentPopupVisible = !this.agentPopupVisible;
    if (this.agentPopupVisible) {
      this.focusAgentChatInput();
    }
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  closeNotifications(): void {
    this.notificationService.cerrarPopup();
  }

  closeAgentChat(): void {
    this.agentPopupVisible = false;
  }

  sendAgentMessage(): void {
    const mensaje = this.chatDraft.trim();
    if (!mensaje || this.isSendingAgentMessage) {
      return;
    }

    this.chatMessages = [
      ...this.chatMessages,
      { role: 'user', text: mensaje },
    ];
    this.chatDraft = '';
    this.isSendingAgentMessage = true;

    this.apiService
      .consultarAgente({
        mensaje,
        conversationId: this.agentConversationId,
      })
      .pipe(
        finalize(() => {
          this.isSendingAgentMessage = false;
          this.focusAgentChatInput();
        }),
      )
      .subscribe({
        next: (response) => {
          const respuesta = response?.respuesta?.trim();
          const sources = this.formatearFuentes(response?.fuentes);
          const actions = this.formatearAcciones(response?.acciones);
          this.chatMessages = [
            ...this.chatMessages,
            {
              role: 'agent',
              text:
                respuesta && respuesta.length
                  ? respuesta
                  : 'No recibi una respuesta valida del agente.',
              sources,
              actions,
            },
          ];
        },
        error: (error: HttpErrorResponse) => {
          this.chatMessages = [
            ...this.chatMessages,
            {
              role: 'agent',
              text: this.obtenerMensajeErrorAgente(error),
            },
          ];
        },
      });
  }

  private focusAgentChatInput(): void {
    setTimeout(() => {
      this.agentChatInput?.nativeElement?.focus();
    }, 0);
  }

  private obtenerMensajeErrorAgente(error: HttpErrorResponse): string {
    const backendError = error?.error;

    if (typeof backendError === 'string' && backendError.trim().length > 0) {
      return backendError;
    }

    if (
      backendError &&
      typeof backendError === 'object' &&
      typeof backendError.error === 'string' &&
      backendError.error.trim().length > 0
    ) {
      return backendError.error;
    }

    return 'No pude obtener respuesta del agente en este momento.';
  }

  private formatearFuentes(rawSources: unknown): AgentChatSource[] {
    if (!Array.isArray(rawSources)) {
      return [];
    }

    return rawSources
      .map((source) => {
        if (typeof source === 'string') {
          const value = source.trim();
          if (!value || !/^https?:\/\//i.test(value)) {
            return null;
          }
          return {
            label: 'Abrir fuente',
            type: 'external',
            href: value,
          } as AgentChatSource;
        }

        if (!source || typeof source !== 'object') {
          return null;
        }

        const candidate = source as {
          title?: unknown;
          nombre?: unknown;
          name?: unknown;
          source?: unknown;
          file_name?: unknown;
          fileName?: unknown;
          project_name?: unknown;
          source_type?: unknown;
          source_id?: unknown;
          url?: unknown;
          href?: unknown;
        };

        const label = this.obtenerLabelFuente(candidate);

        const directUrl =
          typeof candidate.url === 'string'
            ? candidate.url.trim()
            : typeof candidate.href === 'string'
              ? candidate.href.trim()
              : '';

        if (directUrl && /^https?:\/\//i.test(directUrl)) {
          return {
            label,
            type: 'external',
            href: directUrl,
          } as AgentChatSource;
        }

        const sourceType =
          typeof candidate.source_type === 'string'
            ? candidate.source_type.trim().toLowerCase()
            : '';
        const sourceId =
          typeof candidate.source_id === 'number'
            ? candidate.source_id
            : Number(candidate.source_id);

        if (!Number.isFinite(sourceId)) {
          return null;
        }

        if (sourceType === 'biblioteca_proyecto') {
          return {
            label,
            type: 'route',
            route: '/biblioteca',
            queryParams: { proyectoId: sourceId },
          } as AgentChatSource;
        }

        if (sourceType === 'ticket') {
          return {
            label,
            type: 'route',
            route: '/tickets',
            queryParams: { ticketId: sourceId },
          } as AgentChatSource;
        }

        return null;
      })
      .filter((value): value is AgentChatSource => Boolean(value));
  }

  abrirFuente(source: AgentChatSource): void {
    if (source.type === 'external' && source.href) {
      window.open(source.href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (source.type === 'route' && source.route) {
      this.router.navigate([source.route], {
        queryParams: source.queryParams ?? {},
      });
      this.closeAgentChat();
    }
  }

  abrirModalCrearTicket(): void {
    this.router.navigate(['/tickets'], {
      queryParams: { openCreateTicket: 1 },
      queryParamsHandling: 'merge',
    });
    this.closeAgentChat();
  }

  mostrarAccionCrearTicket(message: AgentChatMessage): boolean {
    return (
      message.role === 'agent' &&
      Array.isArray(message.actions) &&
      message.actions.includes('open_create_ticket')
    );
  }

  private formatearAcciones(rawActions: unknown): AgentChatAction[] {
    if (!Array.isArray(rawActions)) {
      return [];
    }

    return rawActions
      .map((action) =>
        typeof action === 'string' ? action.trim().toLowerCase() : '',
      )
      .filter((action): action is AgentChatAction =>
        action === 'open_create_ticket',
      );
  }

  private obtenerLabelFuente(source: {
    title?: unknown;
    nombre?: unknown;
    name?: unknown;
    source?: unknown;
    file_name?: unknown;
    fileName?: unknown;
    project_name?: unknown;
    source_type?: unknown;
    source_id?: unknown;
  }): string {
    const preferred = [
      source.title,
      source.nombre,
      source.name,
      source.project_name,
      source.file_name,
      source.fileName,
      source.source,
    ];

    for (const item of preferred) {
      if (typeof item === 'string' && item.trim().length) {
        return item.trim();
      }
    }

    const sourceType =
      typeof source.source_type === 'string' && source.source_type.trim().length
        ? source.source_type.trim().replace(/_/g, ' ')
        : 'Fuente';
    const sourceId =
      typeof source.source_id === 'number' || typeof source.source_id === 'string'
        ? String(source.source_id)
        : '';

    return sourceId ? `${sourceType} #${sourceId}` : sourceType;
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
    // For chat messages, show sender and ticket info
    if (notificacion.tipo === 'chat_mensaje') {
      const remitente = notificacion.metadata?.remitenteNombre;
      const ticketTitulo = notificacion.metadata?.ticketTitulo;
      if (remitente && ticketTitulo) {
        return `${remitente} · ${ticketTitulo}`;
      }
      if (remitente) {
        return `De: ${remitente}`;
      }
      return notificacion.mensaje;
    }

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
