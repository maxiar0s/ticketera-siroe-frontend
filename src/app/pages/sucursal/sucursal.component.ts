import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonsComponent } from './options/options.component';
import { OptionsComponent } from '../../shared/options/options.component';

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [HeaderComponent, TableComponent, CommonModule, ButtonsComponent, OptionsComponent],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {
  public Option:string = 'Todos los ingresos';

  public sucursal!: Sucursal;
  public estado: boolean = false;
  public headerText?: boolean;

  // Id sucursal
  public id: string = '';
  // Id cliente
  public idCliente: string = '';

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.estado = false;
    this.route.params.subscribe(params => {
      const id = params['id'];
      const idCliente = params['idCliente'];
      this.id = id;
      this.idCliente = idCliente;
      this.apiService.sucursal(id).subscribe({
        next: (respuesta) => {
          if(!respuesta) {
            this.router.navigate([`/clientes/${idCliente}`]);
          }
          else {
            this.sucursal = respuesta;
            if(this.sucursal) {
              if(this.sucursal.estado !== 3) {
                this.estado = true;
              } else {
                this.estado = false;
              }
              this.signalService.updateData(this.sucursal?.casaMatriz.razonSocial!);
            } else {
              this.signalService.updateData('');
            }
            this.headerText = true;
          }
        },
        error: (error) => {
          console.error('Error al obtener la sucursal', error);
          this.router.navigate(['/clientes']);
        }
      })
    })
  }

  selectedOption(value: string) {
    this.Option = value;
  }
}
