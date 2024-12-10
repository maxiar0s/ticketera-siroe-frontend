import { Component, Input } from '@angular/core';
import { Sucursal } from '../../../interfaces/sucursal.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sucursal-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() headerText?: boolean = false;
  @Input() sucursal?: Sucursal;
}
