import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { CrearEquipoComponent } from '../../../shared/modal/crear-equipo/crear-equipo.component';
import { concatMap, from } from 'rxjs';
import { Router } from '@angular/router';
import { ImprimirEtiquetaComponent } from '../../../shared/modal/imprimir-etiqueta/imprimir-etiqueta.component';
import { ImprimirEquipo } from '../../../interfaces/imprimir-equipo.interface';

@Component({
  selector: 'sucursal-options',
  standalone: true,
  imports: [CommonModule, CrearEquipoComponent, ImprimirEtiquetaComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class ButtonsComponent {
  public status: boolean = false;

  // Id Sucursal
  @Input() id?: string;

  // Id Cliente
  @Input() idCliente?: string;

  // Equipos para imprimir
  @Input() devices: ImprimirEquipo[] = [];

  public isModalVisibleCrearEquipo: boolean = false;
  public isModalVisibleImprimirEtiqueta: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router
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
      button?.classList.remove('disabled-button');
      button?.classList.add('agregar', 'agregar-equipo');
      img?.setAttribute('src', '/assets/svg/agregar-equipo.svg');
    }
  }

  crearEquipos(datos: any) {
    const { cantidad } = datos;
    from(Array(cantidad).keys()).pipe(
      concatMap(() => this.apiService.createEquiptment(datos))
    ).subscribe({
      next: (respuesta) => {
        if (respuesta.error) {
          console.error('Error al crear equipo:', respuesta.error);
          this.errorMessage += 'Error al crear equipo: ' + respuesta.error + '\n';
        } else {
          console.log('Equipo creado exitosamente:', respuesta);
          this.successMessage += 'Equipo creado exitosamente!\n';
        }
      },
      error: (error) => {
        console.error('Error al crear equipos:', error);
        this.errorMessage += 'Error al crear equipos: ' + error + '\n';
      },
      complete: () => {
        this.cerrarModalCrearEquipo();
        this.router.navigate(['/clientes', this.idCliente, 'sucursal', this.id])
      }
    })
  }

  @Input()
  set selectedDevices(devices: ImprimirEquipo[]) {
    const img = document.querySelector('#imprimir-equipos-image');
    const button = document.querySelector('#inprimir-equipos-button');
    this.devices = devices;
    if(devices.length > 0) {
      button?.removeAttribute('disabled');
      button?.classList.remove('disabled-button');
      button?.classList.add('agregar', 'agregar-equipo');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas.svg');
    } else {
      button?.setAttribute('disabled', 'true');
      button?.classList.remove('agregar', 'agregar-equipo');
      button?.classList.add('disabled-button');
      img?.setAttribute('src', '/assets/svg/imprimir-etiquetas-disabled.svg');
    }
  }
}
