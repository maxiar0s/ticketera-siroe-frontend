import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleDonutChartComponent } from '../../../../shared/charts/simple-donut-chart.component';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-by-priority',
  standalone: true,
  imports: [CommonModule, SimpleDonutChartComponent],
  template: `
    <div class="card">
      <h3>Tickets por Prioridad</h3>
      <simple-donut-chart
        [data]="chartData"
        [colors]="['#22c55e', '#eab308', '#ef4444']"
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
export class TicketByPriorityComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const counts: { [key: string]: number } = { Baja: 0, Media: 0, Alta: 0 };

    this.tickets.forEach((ticket) => {
      const priority = ticket.prioridad || 'Media';
      if (counts.hasOwnProperty(priority)) {
        counts[priority]++;
      }
    });

    this.chartData = Object.keys(counts).map((key) => ({
      label: key,
      value: counts[key],
    }));
  }
}
