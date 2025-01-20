import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validarRut(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) return null;

    const limpiar = value.replace('-', '');

    if (limpiar.length < 8 || limpiar.length > 10) {
      return { invalidRutLength: true };
    }

    return null;
  };
}
