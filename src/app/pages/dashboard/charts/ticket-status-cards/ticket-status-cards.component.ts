import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-status-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-status-cards.component.html',
  styleUrls: ['./ticket-status-cards.component.css'],
})
export class TicketStatusCardsComponent implements OnInit {
  @Input() tickets: Ticket[] = [];

  statusCounts: { label: string; count: number; class: string }[] = [];

  ngOnInit(): void {
    this.calculateCounts();
  }

  ngOnChanges(): void {
    this.calculateCounts();
  }

  private calculateCounts(): void {
    const counts = {
      Nuevo: 0,
      Abierto: 0,
      Pendiente: 0,
      'En espera': 0,
      Resuelto: 0,
      Cerrado: 0,
    };

    this.tickets.forEach((ticket) => {
      if (counts.hasOwnProperty(ticket.estadoTicket)) {
        counts[ticket.estadoTicket]++;
      }
    });

    this.statusCounts = [
      { label: 'Nuevo', count: counts['Nuevo'], class: 'bg-new' },
      { label: 'Abierto', count: counts['Abierto'], class: 'bg-open' },
      { label: 'Pendiente', count: counts['Pendiente'], class: 'bg-pending' },
      { label: 'En espera', count: counts['En espera'], class: 'bg-waiting' },
      { label: 'Resuelto', count: counts['Resuelto'], class: 'bg-resolved' },
      { label: 'Cerrado', count: counts['Cerrado'], class: 'bg-closed' },
    ];
  }
}
