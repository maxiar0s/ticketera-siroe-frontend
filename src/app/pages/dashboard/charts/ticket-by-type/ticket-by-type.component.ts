import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleDonutChartComponent } from '../../../../shared/charts/simple-donut-chart.component';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-by-type',
  standalone: true,
  imports: [CommonModule, SimpleDonutChartComponent],
  template: `
    <div class="card">
      <h3>Tickets por Cliente</h3>
      <simple-donut-chart
        [data]="chartData"
        [colors]="['#22c55e', '#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6']"
      ></simple-donut-chart>
    </div>
  `,
  styles: [
    `
      .card {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        padding: 0.1rem 0.2rem 0.35rem;
      }

      h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-ink);
      }

      simple-donut-chart {
        display: block;
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class TicketByTypeComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const counts: Record<string, number> = {};

    this.tickets.forEach((ticket) => {
      const cliente = this.getClienteLabel(ticket);
      counts[cliente] = (counts[cliente] || 0) + 1;
    });

    this.chartData = Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  private getClienteLabel(ticket: Ticket): string {
    const nombre = ticket.casaMatriz?.razonSocial?.trim();
    if (nombre) {
      return nombre;
    }

    const casaMatrizId = String(ticket.casaMatrizId || '').trim();
    if (casaMatrizId) {
      return `Cliente ${casaMatrizId}`;
    }

    return 'Cliente no identificado';
  }
}
