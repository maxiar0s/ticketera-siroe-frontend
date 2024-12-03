import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SignalService } from '../../services/signal.service';
import { compileNgModule } from '@angular/compiler';

@Component({
  selector: 'shared-top-bar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
  public title = this.signalService.getDataSignal();

  constructor(private signalService: SignalService) {}
}
