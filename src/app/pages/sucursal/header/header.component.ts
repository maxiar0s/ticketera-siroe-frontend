import { Component, Input } from '@angular/core';
import { Sucursal } from '../../../interfaces/sucursal.interface';
import { CommonModule } from '@angular/common';
import { SignedUrlPipe } from '../../../pipes/generar-url.pipe';

@Component({
  selector: 'sucursal-header',
  standalone: true,
  imports: [CommonModule, SignedUrlPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() sucursal?: Sucursal;
}
