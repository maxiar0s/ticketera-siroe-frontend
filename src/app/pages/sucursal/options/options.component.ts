import { Component, Input } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { CrearEquipoComponent } from '../../../shared/modal/crear-equipo/crear-equipo.component';
import { concatMap, from } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'sucursal-options',
  standalone: true,
  imports: [CommonModule, CrearEquipoComponent],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class ButtonsComponent {
  @Input() estado: boolean = false;

  // Id Sucursal
  @Input() id?: string;

  // Id Cliente
  @Input() idCliente?: string;

  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router
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
        this.router.navigate(['/clientes', this.idCliente, 'sucursal', this.id])
      }
    })

  }
}
