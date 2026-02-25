import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleLineChartComponent } from '../../../../shared/charts/simple-line-chart.component';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-count-by-month',
  standalone: true,
  imports: [CommonModule, SimpleLineChartComponent],
  template: `
    <div class="card">
      <h3>Tickets por Mes</h3>
      <simple-line-chart [data]="chartData"></simple-line-chart>
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

      simple-line-chart {
        display: block;
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class TicketCountByMonthComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const currentYear = new Date().getFullYear();
    const counts = new Array(12).fill(0);

    this.tickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt);
      if (date.getFullYear() === currentYear) {
        counts[date.getMonth()]++;
      }
    });

    this.chartData = months.map((month, index) => ({
      label: month,
      value: counts[index],
    }));
  }
}
