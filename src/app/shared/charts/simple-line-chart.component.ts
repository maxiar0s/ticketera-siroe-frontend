import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'simple-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <svg viewBox="0 0 500 200" class="line-chart">
        <!-- Grid lines -->
        <line
          x1="50"
          y1="150"
          x2="480"
          y2="150"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <line
          x1="50"
          y1="100"
          x2="480"
          y2="100"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <line
          x1="50"
          y1="50"
          x2="480"
          y2="50"
          stroke="#e5e7eb"
          stroke-width="1"
        />

        <!-- Y Axis Labels -->
        <text x="40" y="155" text-anchor="end" font-size="12" fill="#6b7280">
          0
        </text>
        <text x="40" y="105" text-anchor="end" font-size="12" fill="#6b7280">
          {{ maxValue / 2 | number : '1.0-0' }}
        </text>
        <text x="40" y="55" text-anchor="end" font-size="12" fill="#6b7280">
          {{ maxValue }}
        </text>

        <!-- The Line -->
        <polyline
          [attr.points]="points"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
        />

        <!-- Data Points -->
        <circle
          *ngFor="let p of pointCoordinates"
          [attr.cx]="p.x"
          [attr.cy]="p.y"
          r="3"
          fill="#3b82f6"
        />

        <!-- X Axis Labels -->
        <text
          *ngFor="let p of pointCoordinates; let i = index"
          [attr.x]="p.x"
          y="170"
          text-anchor="middle"
          font-size="12"
          fill="#6b7280"
        >
          {{ data[i].label }}
        </text>
      </svg>
    </div>
  `,
  styles: [
    `
      .chart-container {
        width: 100%;
        height: 100%;
        min-height: 220px;
      }
      .line-chart {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
    `,
  ],
})
export class SimpleLineChartComponent implements OnChanges {
  @Input() data: { label: string; value: number }[] = [];

  points: string = '';
  pointCoordinates: { x: number; y: number }[] = [];
  maxValue: number = 10;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePoints();
  }

  private calculatePoints(): void {
    if (!this.data.length) return;

    this.maxValue = Math.max(...this.data.map((d) => d.value), 10); // Min max value 10

    const width = 430; // 480 - 50
    const height = 100; // 150 - 50 (drawing area)
    const startX = 50;
    const startY = 150; // Bottom Y

    const stepX = width / (this.data.length - 1 || 1);

    this.pointCoordinates = this.data.map((item, index) => {
      const x = startX + index * stepX;
      const y = startY - (item.value / this.maxValue) * height;
      return { x, y };
    });

    this.points = this.pointCoordinates.map((p) => `${p.x},${p.y}`).join(' ');
  }
}
