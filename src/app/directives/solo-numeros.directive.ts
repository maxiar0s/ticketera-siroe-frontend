import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[formatInputNumber]',
})
export class FormatInputSoloNumerosDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange() {
    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');

    input.value = value;
  }
}
