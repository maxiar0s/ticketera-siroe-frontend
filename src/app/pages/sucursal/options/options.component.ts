import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { CrearEquipoComponent } from '../../../shared/modal/equipo/crear-equipo/crear-equipo.component';
import { ImprimirEtiquetaComponent } from '../../../shared/modal/imprimir-etiqueta/imprimir-etiqueta.component';
import { ImprimirEquipo } from '../../../interfaces/ImprimirEquipo.interface';

@Component({
  selector: 'sucursal-options',
  standalone: true,
  imports: [CommonModule, CrearEquipoComponent, ImprimirEtiquetaComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class ButtonsComponent {
  public status: boolean = false;

  @Output() crearEquiposForm = new EventEmitter<any>();
  @Output() borrarEquipos = new EventEmitter<number[]>();
  @Output() exportarEquipos = new EventEmitter<void>();

  // Equipos para imprimir
  @Input() devices: ImprimirEquipo[] = [];
  @Input() clienteTieneArriendo: boolean = false;

  public isModalVisibleCrearEquipo: boolean = false;
  public isModalVisibleImprimirEtiqueta: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  public readonly esCliente: boolean;
  private selectedIds: number[] = [];

  constructor(
    private authService: AuthService
  ) {
    this.esCliente = this.authService.esCliente();
  }

  abrirModalCrearEquipo() {
    if (this.esCliente) {
      return;
    }
    this.isModalVisibleCrearEquipo = true;
  }

  cerrarModalCrearEquipo() {
    this.isModalVisibleCrearEquipo = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  abrirModalImprimirEtiqueta() {
    if (this.esCliente) {
      return;
    }
    this.isModalVisibleImprimirEtiqueta = true;
  }

  cerrarModalImprimirEtiqueta() {
    this.isModalVisibleImprimirEtiqueta = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  @Input()
  set estado(value: boolean) {
    if (this.esCliente) {
      this.status = false;
      return;
    }
    this.status = value;

    if (!this.status) {
      return;
    }

    const img = document.querySelector('#agregar-image');
    const button = document.querySelector('#agregar-button');

    button?.removeAttribute('disabled');
    button?.classList.add('agregar', 'agregar-equipo');
    img?.setAttribute('src', '/assets/svg/agregar-equipo.svg');
  }

  crearEquipos(event: any) {
    if (this.esCliente) {
      return;
    }
    this.crearEquiposForm.emit(event);
  }

  @Input()
  set selectedDevices(devices: ImprimirEquipo[]) {
    this.devices = devices;
    this.selectedIds = devices.map((device) => device.id);

    if (this.esCliente) {
      return;
    }

    const img = document.querySelector(
      '#imprimir-equipos-image'
    ) as HTMLImageElement | null;
    const button = document.querySelector(
      '#inprimir-equipos-button'
    ) as HTMLButtonElement | null;
    const deleteImg = document.querySelector(
      '#borrar-equipos-image'
    ) as HTMLImageElement | null;
    const deleteButton = document.querySelector(
      '#borrar-equipos-button'
    ) as HTMLButtonElement | null;

    if (devices.length > 0) {
      button?.removeAttribute('disabled');
      button?.classList.remove('disabled-button');
      button?.classList.add('imprimir', 'imprimir-equipo');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas.svg');

      deleteButton?.removeAttribute('disabled');
      deleteButton?.classList.remove('disabled-button');
      deleteButton?.classList.add('borrar', 'borrar-equipos');
      deleteImg?.setAttribute('src', '/assets/svg/delete-hover.svg');
    } else {
      button?.setAttribute('disabled', 'true');
      button?.classList.remove('imprimir', 'imprimir-equipo');
      button?.classList.add('disabled-button');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas-disabled.svg');

      deleteButton?.setAttribute('disabled', 'true');
      deleteButton?.classList.remove('borrar', 'borrar-equipos');
      deleteButton?.classList.add('disabled-button');
      deleteImg?.setAttribute('src', '/assets/svg/delete.svg');
    }
  }

  borrarEquiposSeleccionados(): void {
    if (this.esCliente || this.selectedIds.length === 0) {
      return;
    }
    this.borrarEquipos.emit([...this.selectedIds]);
  }

  exportarEquiposListado(): void {
    if (this.esCliente) {
      return;
    }
    this.exportarEquipos.emit();
  }

  @Input()
  set cerrarModal(event: boolean) {
    console.log(event);
    this.isModalVisibleCrearEquipo = event;
  }
}




