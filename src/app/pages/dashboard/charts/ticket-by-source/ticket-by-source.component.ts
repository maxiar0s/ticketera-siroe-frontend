import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleDonutChartComponent } from '../../../../shared/charts/simple-donut-chart.component';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-by-source',
  standalone: true,
  imports: [CommonModule, SimpleDonutChartComponent],
  template: `
    <div class="card">
      <h3>Tickets por Fuente</h3>
      <simple-donut-chart
        [data]="chartData"
        [colors]="['#3b82f6', '#f97316']"
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
export class TicketBySourceComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const counts: { [key: string]: number } = { Web: 0, Email: 0 };

    this.tickets.forEach((ticket) => {
      const source = ticket.fuente || 'Web'; // Default to Web if undefined
      if (counts.hasOwnProperty(source)) {
        counts[source]++;
      }
    });

    this.chartData = Object.keys(counts).map((key) => ({
      label: key,
      value: counts[key],
    }));
  }
}
