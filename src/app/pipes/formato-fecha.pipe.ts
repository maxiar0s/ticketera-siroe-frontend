
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'formatoFecha',
  standalone: true,
  pure: true,
})
export class FormatoFechaPipe implements PipeTransform {
  private datePipe = new DatePipe('es');

  transform(value: Date | string | number, format: string = 'fullDate'): string | null {
    if (!value) return null;
    return this.datePipe.transform(value, format);
  }
}
