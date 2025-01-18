import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';

@Component({
  selector: 'cliente-sucursales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent {
  public obtainedSucursales: boolean = false;
  public sucursales: Sucursal[] = [];

  @Input()
  set setSucursales(value: Sucursal[]) {
    this.sucursales = value;
    this.obtainedSucursales = true;
  }
}
