import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { Sucursal } from '../../../../interfaces/sucursal.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';
import { SignalService } from '../../../../services/signal.service';

@Component({
  selector: 'cliente-sucursales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent {
  public sucursales: Sucursal[] = [];

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private signalService:SignalService
  ) {  }

  ngOnInit() {
    this.signalService.updateData('');
    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.sucursales(id).subscribe({
        next: (respuesta) => {
          this.sucursales = respuesta;
          this.signalService.updateData(this.sucursales[0].Cliente.razonSocial);
        },
        error: (error) => {
          console.error('Error al obtener sucursales', error);
        }
      })
    })
  }
}
