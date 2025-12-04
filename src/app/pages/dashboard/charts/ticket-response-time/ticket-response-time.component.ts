import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleLineChartComponent } from '../../../../shared/charts/simple-line-chart.component';
import { Ticket } from '../../../../interfaces/ticket.interface';

@Component({
  selector: 'app-ticket-response-time',
  standalone: true,
  imports: [CommonModule, SimpleLineChartComponent],
  template: `
    <div class="card">
      <h3>Tiempo de Respuesta Promedio (Horas)</h3>
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
export class TicketResponseTimeComponent implements OnChanges {
  @Input() tickets: Ticket[] = [];
  chartData: { label: string; value: number }[] = [];

  ngOnChanges(): void {
    this.processData();
  }

  private processData(): void {
    // Mock calculation for now as we need historical data for accurate response times per month
    // Assuming we calculate average response time for tickets created in each month

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
    const responseTimesSum = new Array(12).fill(0);
    const responseTimesCount = new Array(12).fill(0);

    this.tickets.forEach((ticket) => {
      const created = new Date(ticket.createdAt);
      if (created.getFullYear() === currentYear && ticket.fechaRespuesta) {
        const responded = new Date(ticket.fechaRespuesta);
        const diffHours =
          (responded.getTime() - created.getTime()) / (1000 * 60 * 60);

        const month = created.getMonth();
        responseTimesSum[month] += diffHours;
        responseTimesCount[month]++;
      }
    });

    this.chartData = months.map((month, index) => ({
      label: month,
      value:
        responseTimesCount[index] > 0
          ? Math.round(responseTimesSum[index] / responseTimesCount[index])
          : 0,
    }));
  }
}
