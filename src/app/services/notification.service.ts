import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import {
  Notificacion,
  NotificacionListadoRespuesta,
} from '../interfaces/notificacion.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private readonly unreadSubject = new BehaviorSubject<number>(0);
  private readonly popupVisibleSubject = new BehaviorSubject<boolean>(false);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  private initialPopupShown = false;

  readonly notificaciones$ = this.notificacionesSubject.asObservable();
  readonly unreadCount$ = this.unreadSubject.asObservable();
  readonly popupVisible$ = this.popupVisibleSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {}

  cargarNotificaciones(force = false): void {
    if (this.loadingSubject.value) {
      return;
    }
    if (!force && this.notificacionesSubject.value.length > 0) {
      return;
    }

    this.loadingSubject.next(true);
    this.apiService
      .notificacionesListado()
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (respuesta: NotificacionListadoRespuesta) => {
          const lista = Array.isArray(respuesta?.notificaciones)
            ? respuesta.notificaciones
            : [];
          const totalNoLeidas = Number.isInteger(respuesta?.totalNoLeidas)
            ? respuesta.totalNoLeidas
            : 0;

          this.notificacionesSubject.next(lista);
          this.unreadSubject.next(totalNoLeidas);

          if (totalNoLeidas > 0 && !this.initialPopupShown) {
            this.popupVisibleSubject.next(true);
          }
        },
        error: (error) => {
          console.error('Error al cargar notificaciones', error);
        },
      });
  }

  refrescar(): void {
    this.loadingSubject.next(true);
    this.apiService
      .notificacionesListado()
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (respuesta) => {
          const lista = Array.isArray(respuesta?.notificaciones)
            ? respuesta.notificaciones
            : [];
          const totalNoLeidas = Number.isInteger(respuesta?.totalNoLeidas)
            ? respuesta.totalNoLeidas
            : 0;

          this.notificacionesSubject.next(lista);
          this.unreadSubject.next(totalNoLeidas);
        },
        error: (error) => {
          console.error('Error al refrescar notificaciones', error);
        },
      });
  }

  abrirPopup(): void {
    this.initialPopupShown = true;
    this.popupVisibleSubject.next(true);
  }

  cerrarPopup(): void {
    this.initialPopupShown = true;
    this.popupVisibleSubject.next(false);
  }

  togglePopup(): void {
    if (this.popupVisibleSubject.value) {
      this.cerrarPopup();
    } else {
      this.abrirPopup();
    }
  }

  marcarComoLeidas(ids: number[]): void {
    const idsValidos = Array.isArray(ids)
      ? ids.filter((id) => Number.isInteger(id) && id > 0)
      : [];
    if (idsValidos.length === 0) {
      this.cerrarPopup();
      return;
    }

    this.apiService.marcarNotificacionesLeidas(idsValidos).subscribe({
      next: () => {
        this.actualizarEstadoLeido(idsValidos);
      },
      error: (error) => {
        console.error('Error al marcar notificaciones como leidas', error);
      },
    });
  }

  marcarTodasComoLeidas(): void {
    this.apiService.marcarTodasNotificaciones().subscribe({
      next: () => {
        const actuales = this.notificacionesSubject.value.map((item) => ({
          ...item,
          leida: true,
        }));
        this.notificacionesSubject.next(actuales);
        this.unreadSubject.next(0);
        this.cerrarPopup();
      },
      error: (error) => {
        console.error('Error al marcar todas las notificaciones como leidas', error);
      },
    });
  }

  private actualizarEstadoLeido(ids: number[]): void {
    const actuales = this.notificacionesSubject.value;
    if (!actuales.length) {
      this.unreadSubject.next(0);
      return;
    }

    const idsSet = new Set(ids);
    const actualizados = actuales.map((item) =>
      idsSet.has(item.id) ? { ...item, leida: true } : item
    );
    this.notificacionesSubject.next(actualizados);
    const pendientes = actualizados.reduce(
      (acum, notif) => (notif.leida ? acum : acum + 1),
      0
    );
    this.unreadSubject.next(pendientes);
  }
}
