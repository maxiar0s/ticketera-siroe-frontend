import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoFecha',
  standalone: true
})
export class FormatoFechaPipe implements PipeTransform {

  transform(value: string): string | null {
    if(!value) return null;

    const partes = value.split('-');
    if (partes.length !== 3) {
      throw new Error('Formato de fecha inválido.');
    }

    const [anio, dia, mes] = partes;
    return `${dia}/${mes}/${anio}`;
  }

}
