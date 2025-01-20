import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[formatInputRut]',
})
export class FormatInputRutDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange() {
    const input = this.el.nativeElement as HTMLInputElement;
    let reemplazoCaracteres = input.value.replace(/[^0-9]/g, '');

    reemplazoCaracteres = reemplazoCaracteres.slice(0, 9);

    let formatearTelefono = reemplazoCaracteres;
    if (formatearTelefono.length === 8) {
      formatearTelefono = formatearTelefono.slice(0, 7) + '-' + formatearTelefono.slice(7, 8);
    } else if (formatearTelefono.length === 9) {
      formatearTelefono = formatearTelefono.slice(0, 8) + '-' + formatearTelefono.slice(8, 9);
    }

    input.value = formatearTelefono;
  }
}
