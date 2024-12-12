import { Component } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../../../../interfaces/cliente.interface';

@Component({
  selector: 'cliente-casa-matriz',
  standalone: true,
  imports: [],
  templateUrl: './casa-matriz.component.html',
  styleUrl: './casa-matriz.component.css'
})
export class CasaMatrizComponent {
  public cliente?:Cliente;
  public ruta:string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id']
      this.apiService.client(id).subscribe({
        next: (respuesta) => {
          this.cliente = respuesta;
          console.log(this.cliente);
        },
        error: (error) => {
          console.error('Error al obtener la sucursal', error);
          this.router.navigate(['/clientes']);
        }
      })
    })
  }
}
