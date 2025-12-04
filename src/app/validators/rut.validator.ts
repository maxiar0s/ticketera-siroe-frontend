import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validarRut(tipo: 'Rut' | 'Ruc' | 'Dni' = 'Rut'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) return null;

    if (tipo === 'Rut') {
      const limpiar = value.replace(/[^0-9kK]/g, '');
      if (limpiar.length < 8 || limpiar.length > 9) {
        return { invalidRutLength: true };
      }
      // Basic Modulo 11 check could be added here if needed, but length check is a good start
    } else if (tipo === 'Ruc') {
      const limpiar = value.replace(/[^0-9]/g, '');
      if (limpiar.length !== 11) {
        return { invalidRucLength: true };
      }
    } else if (tipo === 'Dni') {
      const limpiar = value.replace(/[^0-9]/g, '');
      if (limpiar.length < 8) {
        // DNI is usually 8, but sometimes varies slightly by country context
        return { invalidDniLength: true };
      }
    }

    return null;
  };
}
