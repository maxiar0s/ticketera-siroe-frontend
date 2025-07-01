import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Cliente } from '../../../interfaces/cliente.interface';

@Component({
  selector: 'dashboard-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent implements OnChanges {
  @Input() option: string = 'Todos los ingresos';
  clientes: Cliente[] = [];
  loading = false;

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['option']) {
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    // Aquí puedes cambiar la lógica según el endpoint real y la opción seleccionada
    // Por ejemplo, si tienes endpoints distintos para pendientes/terminados, cámbialo aquí
    this.api.clients(1).subscribe({
      next: (res) => {
        // Filtra según la opción si es necesario
        this.clientes = res?.clientes || [];
        this.loading = false;
      },
      error: () => {
        this.clientes = [];
        this.loading = false;
      }
    });
  }
}
