import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  public equipos: Equipo[] = [];
  @Input() id: string = '';

constructor(
  private apiService: ApiService
) {  }


  ngOnInit() {
    this.apiService.equipmentsBySucursal(this.id).subscribe({
      next: (respuesta) => {
        this.equipos = respuesta;
        console.log(this.equipos);
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
      }
    })
  }
}
