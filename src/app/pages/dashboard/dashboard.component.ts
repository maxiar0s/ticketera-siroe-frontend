import { Component, OnInit } from '@angular/core';
import { ChartsComponent } from './charts/charts.component';
import { SummaryComponent } from './summary/summary.component';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { SignalService } from '../../services/signal.service';
import { OptionsComponent } from '../../shared/options/options.component';
import { DASHBOARD_CONFIG } from '../../config/dashboard';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChartsComponent,
    SummaryComponent,
    NavegationComponent,
    OptionsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  public Option: string = 'Todos los ingresos';
  public dashboardConfig = DASHBOARD_CONFIG;

  constructor(private signalService: SignalService) {}

  ngOnInit() {
    this.signalService.updateData('Dashboard');
  }

  selectedOption(value: string) {
    this.Option = value;
  }
}
