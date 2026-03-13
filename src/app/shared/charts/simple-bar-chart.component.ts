import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'simple-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simple-bar-chart.component.html',
  styleUrl: './simple-bar-chart.component.css',
})
export class SimpleBarChartComponent implements OnChanges {
  @Input() data: { label: string, value: number }[] = [];
  maxValue = 1;

  ngOnChanges(changes: SimpleChanges): void {
    this.maxValue = this.data.length > 0 ? Math.max(...this.data.map(d => d.value)) : 1;
  }
}
