import { Component, Input } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { OptionsComponent } from './options/options.component';
import { TableComponent } from './table/table.component';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, TableComponent, NavegationComponent, CommonModule],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {
  public sucursal?: Sucursal;
  public headerText?: boolean;
  public id: string = '';
  public hideNavegation?: boolean;

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.signalService.updateData('Equipos | Levantamiento');
    this.route.params.subscribe(params => {
      const id = params['id']
      this.id = id;
      this.apiService.sucursal(id).subscribe({
        next: (respuesta) => {
          this.sucursal = respuesta;
          this.headerText = true;
        },
        error: (error) => {
          console.error('Error al obtener la sucursal', error);
          this.router.navigate(['/clientes']);
        }
      })
    })

    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.sucursal(id).subscribe({
        next: (respuesta) => {
          this.sucursal = respuesta;
        },
        error: (error) => {
          console.error('Error al obtener la sucursal', error);
          this.router.navigate(['/clientes']);
        }
      })
    })
  }

  hideNav(value: boolean) {
    this.hideNavegation = value;
  }
}
