import { Component } from '@angular/core';
import { ChartsComponent } from '../dashboard/charts/charts.component';
import { SignalService } from '../../services/signal.service';

@Component({
  selector: 'client-dashboard',
  standalone: true,
  imports: [ChartsComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css',
})
export class ClientDashboardComponent {
  constructor(private signalService: SignalService) {}

  ngOnInit(): void {
    this.signalService.updateData('Dashboard Cliente');
  }
}
