import { Component, Input, OnInit } from '@angular/core';
import { SimpleBarChartComponent } from '../../../shared/charts/simple-bar-chart.component';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';

@Component({
  selector: 'dashboard-charts',
  standalone: true,
  imports: [SimpleBarChartComponent],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit {
  @Input() option: string = 'Todos los ingresos';

  equiposData = [
    { label: 'PC', value: 0 },
    { label: 'Notebook', value: 0 },
    { label: 'Impresora', value: 0 }
  ];
  equiposPorClienteData = [
    { label: 'Cliente A', value: 8 },
    { label: 'Cliente B', value: 10 },
    { label: 'Cliente C', value: 5 }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Traer todos los clientes y recorrer sucursales y equipos
    this.api.clients(1).subscribe((res: any) => {
      const clientes = res?.clientes || [];
      let pc = 0, notebook = 0, impresora = 0;
      clientes.forEach((cliente: any) => {
        (cliente.sucursales || []).forEach((sucursal: any) => {
          (sucursal.equipos || []).forEach((equipo: any) => {
            const tipo = equipo.tipoEquipo?.name?.toLowerCase();
            if (tipo === 'pc') pc++;
            else if (tipo === 'notebook') notebook++;
            else if (tipo === 'impresora') impresora++;
          });
        });
      });
      this.equiposData = [
        { label: 'PC', value: pc },
        { label: 'Notebook', value: notebook },
        { label: 'Impresora', value: impresora }
      ];
    });
  }
}
