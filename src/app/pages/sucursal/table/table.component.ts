import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Sucursal } from '../../../interfaces/sucursal.interface';

@Component({
  selector: 'sucursal-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {


  ngOnInit() {

  }
}
