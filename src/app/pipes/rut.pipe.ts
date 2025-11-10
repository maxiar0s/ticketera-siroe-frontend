import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rut',
  standalone: true
})
export class RutPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }

    const limpio = `${value}`.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!limpio.length) {
      return '';
    }

    if (limpio.length === 1) {
      return limpio;
    }

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${cuerpoFormateado}-${dv}`;
  }
}
