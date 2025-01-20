import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'telefono',
  standalone: true,
})
export class TelefonoPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    let formateado = '+569' + value.slice(1);
    formateado = formateado.replace(/(\+569)(\d{4})(\d{4})/, '$1 $2 $3');

    return formateado;
  }
}
