import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import {
  MensajeTicket,
  ActividadTicket,
  ChatItem,
  TypingIndicator,
} from '../../interfaces/chat.interface';

@Component({
  selector: 'app-ticket-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-chat.component.html',
  styleUrls: ['./ticket-chat.component.css'],
})
export class TicketChatComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @Input() ticketId!: number;
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  timeline: ChatItem[] = [];
  nuevoMensaje = '';
  loading = true;
  enviando = false;
  isTyping = false;
  typingUsers: Map<number, string> = new Map();
  currentUserId: number | null = null;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = true;

  constructor(
    private apiService: ApiService,
    public chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.decodificarToken()?.id ?? null;
    this.cargarTimeline();
    this.conectarSocket();
    this.suscribirEventos();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.chatService.leaveTicket(this.ticketId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarTimeline(): void {
    this.loading = true;
    this.apiService
      .getTicketTimeline(this.ticketId, { limite: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.timeline = response.data || [];
          this.loading = false;
          this.shouldScrollToBottom = true;
          // Marcar mensajes como leídos
          this.apiService.marcarMensajesLeidosTicket(this.ticketId).subscribe();
        },
        error: (err) => {
          console.error('Error al cargar timeline:', err);
          this.loading = false;
        },
      });
  }

  private conectarSocket(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.chatService.connect(token);
      this.chatService.joinTicket(this.ticketId);
    }
  }

  private suscribirEventos(): void {
    // Nuevos mensajes en tiempo real
    this.chatService.onNewMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mensaje) => {
        if (mensaje.ticketId === this.ticketId) {
          this.timeline.push({ ...mensaje, itemType: 'mensaje' });
          this.shouldScrollToBottom = true;
          // Marcar como leído si no es nuestro mensaje
          if (mensaje.cuentaId !== this.currentUserId) {
            this.apiService
              .marcarMensajesLeidosTicket(this.ticketId)
              .subscribe();
          }
        }
      });

    // Nueva actividad en tiempo real
    this.chatService.onNewActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe((actividad) => {
        if (actividad.ticketId === this.ticketId) {
          this.timeline.push({ ...actividad, itemType: 'actividad' });
          this.shouldScrollToBottom = true;
        }
      });

    // Indicador de escritura
    this.chatService.onTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: TypingIndicator) => {
        if (data.cuentaId !== this.currentUserId) {
          if (data.isTyping) {
            this.typingUsers.set(data.cuentaId, data.nombre);
          } else {
            this.typingUsers.delete(data.cuentaId);
          }
        }
      });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || this.enviando) {
      return;
    }

    this.enviando = true;
    const mensaje = this.nuevoMensaje.trim();
    this.nuevoMensaje = '';

    this.apiService
      .enviarMensajeTicket(this.ticketId, mensaje)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.enviando = false;
          this.chatService.sendTypingIndicator(this.ticketId, false);
        },
        error: (err) => {
          console.error('Error al enviar mensaje:', err);
          this.nuevoMensaje = mensaje; // Restaurar mensaje
          this.enviando = false;
        },
      });
  }

  onInputChange(): void {
    if (!this.isTyping && this.nuevoMensaje.length > 0) {
      this.isTyping = true;
      this.chatService.sendTypingIndicator(this.ticketId, true);
    } else if (this.isTyping && this.nuevoMensaje.length === 0) {
      this.isTyping = false;
      this.chatService.sendTypingIndicator(this.ticketId, false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  private scrollToBottom(): void {
    if (this.chatContainer?.nativeElement) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // Helpers para el template
  esMensajePropio(item: ChatItem): boolean {
    if (item.itemType !== 'mensaje') return false;
    return (item as MensajeTicket).cuentaId === this.currentUserId;
  }

  getNombreRemitente(item: ChatItem): string {
    if (item.itemType === 'mensaje') {
      return (item as MensajeTicket).remitente?.name || 'Usuario';
    }
    return (item as ActividadTicket).realizadoPor?.name || 'Sistema';
  }

  getActividadIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      estado: '🔄',
      prioridad: '⚡',
      transferencia: '👤',
      asignacion: '📌',
      creacion: '🎫',
      comentario: '💬',
      adjunto: '📎',
    };
    return iconos[tipo] || '📝';
  }

  getActividadTexto(item: ActividadTicket): string {
    const nombre = item.realizadoPor?.name || 'Usuario';
    switch (item.tipo) {
      case 'estado':
        return `${nombre} cambió el estado de "${item.valorAnterior}" a "${item.valorNuevo}"`;
      case 'prioridad':
        return `${nombre} cambió la prioridad de "${item.valorAnterior}" a "${item.valorNuevo}"`;
      case 'transferencia':
        return `${nombre} transfirió el ticket de "${item.valorAnterior}" a "${item.valorNuevo}"`;
      case 'asignacion':
        return `${nombre} asignó el ticket a "${item.valorNuevo}"`;
      case 'creacion':
        return `${nombre} creó el ticket`;
      default:
        return `${nombre} realizó una acción`;
    }
  }

  formatearFecha(fecha: string | Date): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;

    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get typingUsersArray(): string[] {
    return Array.from(this.typingUsers.values());
  }
}
