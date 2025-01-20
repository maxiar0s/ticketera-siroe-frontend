import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rut',
  standalone: true
})
export class RutPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    console.log(value);
    if(value.length === 9) {
      return value.slice(0, 1) + '.' + value.slice(1, 4) + '.' + value.slice(4, 9);
    } else {
      return value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 10);
    }
  }
}
