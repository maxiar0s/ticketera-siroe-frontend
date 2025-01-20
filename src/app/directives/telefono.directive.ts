import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[formatInputTelefono]',
})
export class FormatInputTelefonoDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange() {
    const input = this.el.nativeElement as HTMLInputElement;
    let reemplazoCaracteres = input.value.replace(/[^0-9]/g, '');

    reemplazoCaracteres = reemplazoCaracteres.slice(0, 9);

    let formatearTelefono = reemplazoCaracteres;
    if (formatearTelefono.length > 1 && formatearTelefono.length < 2) {
      formatearTelefono = formatearTelefono.slice(0, 1) + ' ';
    } else if(formatearTelefono.length > 1 && formatearTelefono.length < 6) {
      formatearTelefono = formatearTelefono.slice(0, 1) + ' ' + formatearTelefono.slice(1, 5);
    } else if (formatearTelefono.length > 5 && formatearTelefono.length < 10) {
      formatearTelefono = formatearTelefono.slice(0, 1) + ' ' + formatearTelefono.slice(1, 5) + ' ' + formatearTelefono.slice(5, 9);
    }

    input.value = formatearTelefono;
  }
}
