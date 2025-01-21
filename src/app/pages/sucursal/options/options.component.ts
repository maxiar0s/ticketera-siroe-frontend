import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { CrearEquipoComponent } from '../../../shared/modal/equipo/crear-equipo/crear-equipo.component';
import { concatMap, from } from 'rxjs';
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

  // Equipos para imprimir
  @Input() devices: ImprimirEquipo[] = [];

  public isModalVisibleCrearEquipo: boolean = false;
  public isModalVisibleImprimirEtiqueta: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService
  ) {}

  abrirModalCrearEquipo() {
    this.isModalVisibleCrearEquipo = true;
  }

  cerrarModalCrearEquipo() {
    this.isModalVisibleCrearEquipo = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  abrirModalImprimirEtiqueta() {
    this.isModalVisibleImprimirEtiqueta = true;
  }

  cerrarModalImprimirEtiqueta() {
    this.isModalVisibleImprimirEtiqueta = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  @Input()
  set estado(value: boolean) {
    this.status = value;

    if(!this.status) return;
    else {
      const img = document.querySelector('#agregar-image');
      const button = document.querySelector('#agregar-button');

      button?.removeAttribute('disabled');
      button?.classList.add('agregar', 'agregar-equipo');
      img?.setAttribute('src', '/assets/svg/agregar-equipo.svg');
    }
  }

  crearEquipos(event: any) {
    this.crearEquiposForm.emit(event);
  }

  @Input()
  set selectedDevices(devices: ImprimirEquipo[]) {
    const img = document.querySelector('#imprimir-equipos-image');
    const button = document.querySelector('#inprimir-equipos-button');
    this.devices = devices;
    if(devices.length > 0) {
      button?.removeAttribute('disabled');
      button?.classList.remove('disabled-button');
      button?.classList.add('imprimir', 'imprimir-equipo');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas.svg');
    } else {
      button?.setAttribute('disabled', 'true');
      button?.classList.remove('imprimir', 'imprimir-equipo');
      button?.classList.add('disabled-button');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas-disabled.svg');
    }
  }
}
