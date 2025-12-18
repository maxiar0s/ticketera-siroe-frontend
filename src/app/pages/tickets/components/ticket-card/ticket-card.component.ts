import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../../interfaces/ticket.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule, FormatoFechaPipe],
  templateUrl: './ticket-card.component.html',
  styleUrls: ['./ticket-card.component.css'],
})
export class TicketCardComponent {
  @Input() ticket!: Ticket;
  @Input() isSelected: boolean = false;
  @Input() mensajesNoLeidos: number = 0;

  @Output() onSelect = new EventEmitter<Ticket>();
  @Output() onVerDetalle = new EventEmitter<Ticket>();
  @Output() onCerrar = new EventEmitter<Ticket>();

  formatTicketId(id: number): string {
    return id.toString().padStart(8, '0');
  }

  obtenerClaseEstado(estado: string): string {
    const estadoLower = (estado || '').toLowerCase().replace(/\s+/g, '-');
    return `ticket-state-${estadoLower}`;
  }

  calcularTiempoTranscurrido(fecha: string | Date): string {
    if (!fecha) return '';
    const ahora = new Date();
    const fechaTicket = new Date(fecha);
    const diffMs = ahora.getTime() - fechaTicket.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 14) return 'Hace 1 semana';
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 60) return 'Hace 1 mes';
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  handleClick(): void {
    this.onSelect.emit(this.ticket);
  }

  handleVerDetalle(event: Event): void {
    event.stopPropagation();
    this.onVerDetalle.emit(this.ticket);
  }

  handleCerrar(event: Event): void {
    event.stopPropagation();
    this.onCerrar.emit(this.ticket);
  }

  /**
   * Trunca el contenido HTML preservando el formato (bold, italic, etc.)
   * mientras limita la longitud del texto visible.
   */
  truncateHtml(html: string, maxLength: number): string {
    if (!html) return '';

    // Crear un elemento temporal para trabajar con el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Obtener el texto plano para verificar longitud
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Si el texto es más corto que el límite, devolver el HTML completo
    if (textContent.length <= maxLength) {
      return html;
    }

    // Truncar el contenido preservando etiquetas HTML
    let charCount = 0;
    const truncateNode = (node: Node): boolean => {
      if (charCount >= maxLength) return true;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const remaining = maxLength - charCount;

        if (text.length > remaining) {
          node.textContent = text.substring(0, remaining) + '...';
          charCount = maxLength;
          return true;
        }
        charCount += text.length;
        return false;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const childNodes = Array.from(node.childNodes);
        for (const child of childNodes) {
          if (truncateNode(child)) {
            // Remover nodos hermanos restantes
            let sibling = child.nextSibling;
            while (sibling) {
              const next = sibling.nextSibling;
              node.removeChild(sibling);
              sibling = next;
            }
            return true;
          }
        }
      }
      return false;
    };

    truncateNode(tempDiv);
    return tempDiv.innerHTML;
  }
}
