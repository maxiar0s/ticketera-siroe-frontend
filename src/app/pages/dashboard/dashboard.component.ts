import { Component, OnInit } from '@angular/core';
import { ChartsComponent } from './charts/charts.component';
import { SummaryComponent } from './summary/summary.component';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { SignalService } from '../../services/signal.service';
import { OptionsComponent } from '../../shared/options/options.component';
import { DASHBOARD_CONFIG } from '../../config/dashboard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Ticket } from '../../interfaces/ticket.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
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
    FormsModule,
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

  // Filtro de técnicos
  public esAdmin = false;
  public esTecnico = false;
  public usuarioActualId: number | null = null;
  public tecnicosDisponibles: Tecnico[] = [];
  public filtroTecnicoId: string = '';

  constructor(
    private signalService: SignalService,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.esAdmin = this.authService.esAdministrador();
    this.esTecnico = this.authService.esTecnico();
    const tokenData = this.authService.decodificarToken();
    this.usuarioActualId = tokenData?.id ?? null;
  }

  ngOnInit() {
    this.signalService.updateData('Dashboard');

    // Para técnicos: filtrar por su ID automáticamente
    if (this.esTecnico && this.usuarioActualId) {
      this.filtroTecnicoId = this.usuarioActualId.toString();
    }

    // Para admins: cargar lista de técnicos para el dropdown
    if (this.esAdmin) {
      this.cargarTecnicos();
    }

    this.loadTickets();
  }

  private cargarTecnicos(): void {
    this.apiService.tecnicosDisponibles().subscribe({
      next: (tecnicos) => {
        this.tecnicosDisponibles = tecnicos;
      },
      error: (err) => {
        console.error('Error loading technicians', err);
      },
    });
  }

  loadTickets() {
    if (!this.hasTicketWidgets()) return;

    this.loadingTickets = true;
    const params: Record<string, any> = { limite: 1000 };

    // Aplicar filtro de técnico
    if (this.filtroTecnicoId && this.filtroTecnicoId !== 'todos') {
      params['tecnicoId'] = this.filtroTecnicoId;
    }

    this.apiService.tickets(params).subscribe({
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

  onFiltroChange(): void {
    this.loadTickets();
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
