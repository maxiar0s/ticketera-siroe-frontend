import { Component } from '@angular/core';
import { ChartsComponent } from './charts/charts.component';
import { SummaryComponent } from './summary/summary.component';
import { NavegationComponent } from "../../shared/navegation/navegation.component";
import { SignalService } from '../../services/signal.service';
import { OptionsComponent } from "../../shared/options/options.component";

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [ChartsComponent, SummaryComponent, NavegationComponent, OptionsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  public Option:string = 'Todos los ingresos';

  constructor(
    private signalService: SignalService
  ) { }

  ngOnInit() {
    this.signalService.updateData('Dashboard');
  }


  selectedOption(value: string) {
    this.Option = value;
  }
}
