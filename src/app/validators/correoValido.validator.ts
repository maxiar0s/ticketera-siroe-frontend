import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function correoConArrobaYpunto(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';

    if (value === '') {
      return null;
    }

    const regex = /@.*\.(cl|com)$/;

    return regex.test(value) ? null : { correoInvalido: true };
  };
}
