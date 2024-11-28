import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { OptionsComponent } from './options/options.component';
import { TableComponent } from './table/table.component';
import { NavegationComponent } from '../../shared/navegation/navegation.component';

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, TableComponent, NavegationComponent],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {

}
