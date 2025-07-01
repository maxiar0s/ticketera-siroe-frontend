import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'simple-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="width: 100%; max-width: 400px;">
      <div *ngFor="let bar of data; let i = index" style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 80px;">{{ bar.label }}</div>
        <div style="background: #1976d2; height: 24px; margin-left: 8px;" [style.width.%]="bar.value * 100 / maxValue"></div>
        <div style="margin-left: 8px;">{{ bar.value }}</div>
      </div>
    </div>
  `
})
export class SimpleBarChartComponent implements OnChanges {
  @Input() data: { label: string, value: number }[] = [];
  maxValue = 1;

  ngOnChanges(changes: SimpleChanges): void {
    this.maxValue = this.data.length > 0 ? Math.max(...this.data.map(d => d.value)) : 1;
  }
}
