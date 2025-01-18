import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImprimirEquipo } from '../../../interfaces/ImprimirEquipo.interface';

@Component({
  selector: 'shared-imprimir-etiqueta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-etiqueta.component.html',
  styleUrl: './imprimir-etiqueta.component.css'
})
export class ImprimirEtiquetaComponent {
  @Output() cerrarModal = new EventEmitter<void>();

  @Input() devices: ImprimirEquipo[] = [];

  public isVisible: boolean = true;

  constructor() {}

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.cerrarModal.emit();
  }
}
