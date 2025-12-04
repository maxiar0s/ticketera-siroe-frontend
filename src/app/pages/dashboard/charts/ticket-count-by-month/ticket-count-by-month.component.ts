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
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        height: 100%;
      }
      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
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
