import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  MensajeTicket,
  ActividadTicket,
  ChatItem,
  TypingIndicator,
} from '../interfaces/chat.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private currentTicketId: number | null = null;

  // Observables para mensajes y actividad en tiempo real
  private newMessage$ = new Subject<MensajeTicket>();
  private newActivity$ = new Subject<ActividadTicket>();
  private typingIndicator$ = new Subject<TypingIndicator>();

  readonly isConnected$ = this.connected$.asObservable();
  readonly onNewMessage$ = this.newMessage$.asObservable();
  readonly onNewActivity$ = this.newActivity$.asObservable();
  readonly onTyping$ = this.typingIndicator$.asObservable();

  /**
   * Conecta al servidor Socket.io con el token JWT.
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Usar apiBaseUrl del environment
    const baseUrl = environment.apiBaseUrl;

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[ChatService] Conectado a Socket.io');
      this.connected$.next(true);

      // Reconectar a la sala si había un ticket abierto
      if (this.currentTicketId) {
        this.joinTicket(this.currentTicketId);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[ChatService] Desconectado:', reason);
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[ChatService] Error de conexión:', error.message);
      this.connected$.next(false);
    });

    // Escuchar nuevos mensajes
    this.socket.on('new_message', (mensaje: MensajeTicket) => {
      this.newMessage$.next({ ...mensaje, itemType: 'mensaje' });
    });

    // Escuchar nueva actividad
    this.socket.on('new_activity', (actividad: ActividadTicket) => {
      this.newActivity$.next({ ...actividad, itemType: 'actividad' });
    });

    // Escuchar indicador de escritura
    this.socket.on('user_typing', (data: TypingIndicator) => {
      this.typingIndicator$.next(data);
    });
  }

  /**
   * Desconecta del servidor Socket.io.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
      this.currentTicketId = null;
    }
  }

  /**
   * Une al usuario a la sala de un ticket específico.
   */
  joinTicket(ticketId: number): void {
    if (!this.socket?.connected) {
      console.warn('[ChatService] No conectado, no se puede unir a ticket');
      return;
    }

    // Salir de la sala anterior si existe
    if (this.currentTicketId && this.currentTicketId !== ticketId) {
      this.leaveTicket(this.currentTicketId);
    }

    this.socket.emit('join_ticket', ticketId);
    this.currentTicketId = ticketId;
    console.log(`[ChatService] Unido a ticket ${ticketId}`);
  }

  /**
   * Saca al usuario de la sala de un ticket específico.
   */
  leaveTicket(ticketId: number): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_ticket', ticketId);

    if (this.currentTicketId === ticketId) {
      this.currentTicketId = null;
    }
    console.log(`[ChatService] Salido de ticket ${ticketId}`);
  }

  /**
   * Emite indicador de escritura.
   */
  sendTypingIndicator(ticketId: number, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', { ticketId, isTyping });
  }

  /**
   * Obtiene el ID del ticket actualmente abierto.
   */
  getCurrentTicketId(): number | null {
    return this.currentTicketId;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.newMessage$.complete();
    this.newActivity$.complete();
    this.typingIndicator$.complete();
    this.connected$.complete();
  }
}
