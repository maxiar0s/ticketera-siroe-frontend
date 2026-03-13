import { Component, Input } from '@angular/core';
import { Sucursal } from '../../../interfaces/Sucursal.interface';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { SignedUrlPipe } from '../../../pipes/generar-url.pipe';
import { RutPipe } from '../../../pipes/rut.pipe';

@Component({
  selector: 'sucursal-header',
  standalone: true,
  imports: [CommonModule, SignedUrlPipe, TitleCasePipe, RutPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input() sucursal?: Sucursal;
}
