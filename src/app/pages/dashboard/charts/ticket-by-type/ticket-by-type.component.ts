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
      <h3>Tickets por Prioridad</h3>
      <simple-donut-chart
        [data]="chartData"
        [colors]="['#22c55e', '#f97316', '#ef4444']"
      ></simple-donut-chart>
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
export class TicketByTypeComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    const counts: { [key: string]: number } = {
      Baja: 0,
      Media: 0,
      Alta: 0,
    };

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
