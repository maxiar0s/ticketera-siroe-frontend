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
import { AuthService } from '../../services/auth.service';
import {
  MensajeTicket,
  ActividadTicket,
  ChatItem,
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  timeline: ChatItem[] = [];
  nuevoMensaje = '';
  loading = true;
  enviando = false;
  currentUserId: number | null = null;
  selectedFiles: File[] = [];
  fechaInicioConversacion: Date | null = null;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.decodificarToken()?.id ?? null;
    this.cargarTimeline();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
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

          // Obtener fecha del primer mensaje/actividad
          if (this.timeline.length > 0) {
            this.fechaInicioConversacion = new Date(this.timeline[0].createdAt);
          }

          // Marcar mensajes como leídos
          this.apiService.marcarMensajesLeidosTicket(this.ticketId).subscribe();
        },
        error: (err) => {
          console.error('Error al cargar timeline:', err);
          this.loading = false;
        },
      });
  }

  recargarMensajes(): void {
    this.cargarTimeline();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  abrirSelectorArchivos(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  enviarMensaje(): void {
    if (
      (!this.nuevoMensaje.trim() && this.selectedFiles.length === 0) ||
      this.enviando
    ) {
      return;
    }

    this.enviando = true;
    const mensaje = this.nuevoMensaje.trim();
    const archivos = [...this.selectedFiles];
    this.nuevoMensaje = '';

    // Enviar mensaje con archivos adjuntos si los hay
    this.apiService
      .enviarMensajeTicket(
        this.ticketId,
        mensaje || '(Archivo adjunto)',
        archivos.length > 0 ? archivos : undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          this.timeline.push(respuesta);
          this.shouldScrollToBottom = true;
          this.enviando = false;
          this.selectedFiles = [];
          if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
          }
        },
        error: (err) => {
          console.error('Error al enviar mensaje:', err);
          this.nuevoMensaje = mensaje;
          this.enviando = false;
        },
      });
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

  formatearFechaCompleta(fecha: string | Date): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getAdjuntos(item: ChatItem): string[] {
    if (item.itemType === 'mensaje') {
      return (item as MensajeTicket).adjuntos || [];
    }
    return [];
  }
}
