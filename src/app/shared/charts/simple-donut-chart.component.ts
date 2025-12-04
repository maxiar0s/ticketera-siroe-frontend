import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'simple-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-container">
      <div class="donut-chart" [style.background]="gradient">
        <div class="center-hole"></div>
      </div>
      <div class="legend">
        <div *ngFor="let item of data; let i = index" class="legend-item">
          <span
            class="color-box"
            [style.background-color]="colors[i % colors.length]"
          ></span>
          <span class="label">{{ item.label }}</span>
          <span class="value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .donut-container {
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 1rem;
      }
      .donut-chart {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        position: relative;
      }
      .center-hole {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        background: white;
        border-radius: 50%;
      }
      .legend {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      .color-box {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      .value {
        font-weight: bold;
        margin-left: auto;
      }
    `,
  ],
})
export class SimpleDonutChartComponent implements OnChanges {
  @Input() data: { label: string; value: number }[] = [];
  @Input() colors: string[] = [
    '#3b82f6',
    '#f97316',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#a855f7',
  ];

  gradient: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateGradient();
  }

  private calculateGradient(): void {
    const total = this.data.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0) {
      this.gradient = 'conic-gradient(#e5e7eb 0% 100%)';
      return;
    }

    let currentAngle = 0;
    const gradientParts: string[] = [];

    this.data.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const endAngle = currentAngle + percentage;
      const color = this.colors[index % this.colors.length];
      gradientParts.push(`${color} ${currentAngle}% ${endAngle}%`);
      currentAngle = endAngle;
    });

    this.gradient = `conic-gradient(${gradientParts.join(', ')})`;
  }
}
