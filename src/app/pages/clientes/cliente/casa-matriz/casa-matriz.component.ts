import { Component } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../../../../interfaces/cliente.interface';
import { CommonModule } from '@angular/common';
import { SignedUrlPipe } from '../../../../pipes/generar-url.pipe';

@Component({
  selector: 'cliente-casa-matriz',
  standalone: true,
  imports: [CommonModule, SignedUrlPipe],
  templateUrl: './casa-matriz.component.html',
  styleUrl: './casa-matriz.component.css'
})
export class CasaMatrizComponent {
  public obtainedClient: boolean = false;
  public cliente!:Cliente;
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
          if(!respuesta) this.router.navigate(['/clientes']);
          else {
            this.cliente = respuesta;
            this.obtainedClient = true;
          }
        },
        error: (error) => {
          console.error('Error al obtener la sucursal', error);
          this.router.navigate(['/clientes']);
        }
      })
    })
  }
}
