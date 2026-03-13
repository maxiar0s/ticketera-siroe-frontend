export function normalizarServicios(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item : String(item ?? '')).trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // Ignored: fallback to splitting string
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

export function clienteTieneSoporteTI(servicios: unknown): boolean {
  return normalizarServicios(servicios).some((servicio) => {
    const normalizado = servicio
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalizado === 'soporte ti' || normalizado === 'soportes ti';
  });
}

export function esClienteOculto(valor: unknown): boolean {
  if (typeof valor !== 'string') {
    return false;
  }

  return valor.trim().toLowerCase() === 'ticketera';
}

export function normalizarEsArriendo(valor: unknown): boolean {
  if (typeof valor === 'boolean') {
    return valor;
  }

  if (typeof valor === 'number') {
    return valor === 1;
  }

  if (typeof valor === 'string') {
    const normalized = valor.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return ['true', '1', 'si', 'sí', 'arriendo', 'rent', 'yes'].includes(normalized);
  }

  return false;
}
