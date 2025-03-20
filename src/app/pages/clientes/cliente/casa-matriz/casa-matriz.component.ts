import { Component, Input, OnInit } from '@angular/core';
import { Cliente } from '../../../../interfaces/cliente.interface';
import { CommonModule } from '@angular/common';
import { SignedUrlPipe } from '../../../../pipes/generar-url.pipe';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'cliente-casa-matriz',
  standalone: true,
  imports: [CommonModule, SignedUrlPipe],
  templateUrl: './casa-matriz.component.html',
  styleUrls: ['./casa-matriz.component.css']
})
export class CasaMatrizComponent implements OnInit {
  public obtainedClient: boolean = false;
  @Input() cliente?: Cliente;
  public imageUrl: string | null = null;
  public isLoadingImage: boolean = true;

  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Add debugging to check if the cliente and imagen are available
    if (this.cliente) {
      console.log('Cliente loaded:', this.cliente);
      if (this.cliente.imagen) {
        console.log('Cliente imagen:', this.cliente.imagen);
        // Try to get the signed URL directly
        this.apiService.signedUrl(this.cliente.imagen).subscribe({
          next: (url) => {
            console.log('Signed URL generated successfully:', url);
            this.imageUrl = url;
            this.isLoadingImage = false;
          },
          error: (err) => {
            console.error('Error generating signed URL:', err);
            this.isLoadingImage = false;
          }
        });
      } else {
        console.warn('Cliente does not have an imagen property or it is empty');
        this.isLoadingImage = false;
      }
    } else {
      console.warn('Cliente is not loaded yet');
      this.isLoadingImage = false;
    }
  }
}
