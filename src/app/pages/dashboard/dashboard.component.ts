import { Component, OnInit } from '@angular/core';
import { ChartsComponent } from './charts/charts.component';
import { SummaryComponent } from './summary/summary.component';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { SignalService } from '../../services/signal.service';
import { OptionsComponent } from '../../shared/options/options.component';
import { DASHBOARD_CONFIG } from '../../config/dashboard';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Ticket } from '../../interfaces/ticket.interface';
import { TicketStatusCardsComponent } from './charts/ticket-status-cards/ticket-status-cards.component';
import { TicketCountByMonthComponent } from './charts/ticket-count-by-month/ticket-count-by-month.component';
import { TicketBySourceComponent } from './charts/ticket-by-source/ticket-by-source.component';
import { TicketByPriorityComponent } from './charts/ticket-by-priority/ticket-by-priority.component';
import { TicketByTypeComponent } from './charts/ticket-by-type/ticket-by-type.component';
import { TicketResponseTimeComponent } from './charts/ticket-response-time/ticket-response-time.component';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChartsComponent,
    SummaryComponent,
    NavegationComponent,
    OptionsComponent,
    TicketStatusCardsComponent,
    TicketCountByMonthComponent,
    TicketBySourceComponent,
    TicketByPriorityComponent,
    TicketByTypeComponent,
    TicketResponseTimeComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  public Option: string = 'Todos los ingresos';
  public dashboardConfig = DASHBOARD_CONFIG;
  public tickets: Ticket[] = [];
  public loadingTickets = false;

  constructor(
    private signalService: SignalService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.signalService.updateData('Dashboard');
    this.loadTickets();
  }

  loadTickets() {
    if (!this.hasTicketWidgets()) return;

    this.loadingTickets = true;
    this.apiService.tickets({ limite: 1000 }).subscribe({
      next: (response) => {
        this.tickets = response.data || [];
        this.loadingTickets = false;
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.loadingTickets = false;
      },
    });
  }

  hasTicketWidgets(): boolean {
    return Object.values(this.dashboardConfig.tickets).some(
      (enabled) => enabled
    );
  }

  selectedOption(value: string) {
    this.Option = value;
  }
}
