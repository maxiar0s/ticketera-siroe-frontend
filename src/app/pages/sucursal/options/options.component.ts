import { Component } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { CrearEquipoComponent } from '../../../shared/modal/crear-equipo/crear-equipo.component';
import { concatMap, from } from 'rxjs';

@Component({
  selector: 'sucursal-options',
  standalone: true,
  imports: [CommonModule, CrearEquipoComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class ButtonsComponent {
  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService
  ) {}

  abrirModal() {
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
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
        this.cerrarModal();
      }
    });
  }
}
