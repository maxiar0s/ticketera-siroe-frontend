import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'shared-navegation',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navegation.component.html',
  styleUrl: './navegation.component.css'
})
export class NavegationComponent {
  @Input() paginaActual: number = 1;
  @Input() paginas:      number = 1;
  @Output() cambiarPagina: EventEmitter<number> = new EventEmitter<number>();

  getPaginaArray(): number[] {
    const range: number[] = [];
    const totalPages = this.paginas;
    const currentPage = this.paginaActual;

    const maxPagesToShow = 4;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (currentPage > totalPages - Math.floor(maxPagesToShow / 2)) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
      endPage = totalPages;
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    return range;
  }

  cambiar(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.cambiarPagina.emit(pagina);
    }
  }

  nextPage(): void {
    if (this.paginaActual < this.paginas) {
      this.cambiarPagina.emit(this.paginaActual + 1);
    }
  }

  prevPage(): void {
    if (this.paginaActual > 1) {
      this.cambiarPagina.emit(this.paginaActual - 1);
    }
  }
}
