import { Component } from '@angular/core';
import { ChartsComponent } from './charts/charts.component';
import { SummaryComponent } from './summary/summary.component';
import { NavegationComponent } from "../../shared/navegation/navegation.component";
import { SignalService } from '../../services/signal.service';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [ChartsComponent, SummaryComponent, NavegationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  constructor(
    private signalService: SignalService
  ) { }

  ngOnInit() {
    this.signalService.updateData('Dashboard');
  }

}
