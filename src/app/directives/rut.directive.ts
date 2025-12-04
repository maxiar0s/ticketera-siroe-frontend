import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[formatInputRut]',
})
export class FormatInputRutDirective {
  @Input() documentType: 'Rut' | 'Ruc' | 'Dni' = 'Rut';

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange() {
    const input = this.el.nativeElement as HTMLInputElement;
    let reemplazoCaracteres = input.value.replace(/[^0-9kK]/g, ''); // Allow K for Rut

    if (this.documentType === 'Rut') {
      reemplazoCaracteres = reemplazoCaracteres.replace(/[^0-9kK]/g, '');
      reemplazoCaracteres = reemplazoCaracteres.slice(0, 9);

      let formatearTelefono = reemplazoCaracteres;
      if (formatearTelefono.length > 1) {
        const cuerpo = formatearTelefono.slice(0, -1);
        const dv = formatearTelefono.slice(-1);
        input.value = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
      } else {
        input.value = formatearTelefono;
      }
    } else if (this.documentType === 'Ruc') {
      reemplazoCaracteres = reemplazoCaracteres.replace(/[^0-9]/g, '');
      input.value = reemplazoCaracteres.slice(0, 11);
    } else if (this.documentType === 'Dni') {
      reemplazoCaracteres = reemplazoCaracteres.replace(/[^0-9]/g, '');
      input.value = reemplazoCaracteres.slice(0, 8);
    }
  }
}
