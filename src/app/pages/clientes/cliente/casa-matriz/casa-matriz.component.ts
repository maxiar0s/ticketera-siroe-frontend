import { Component, Input } from '@angular/core';
import { Cliente } from '../../../../interfaces/Cliente.interface';
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
  @Input() cliente?: Cliente;

  constructor(
  ) {}
}
