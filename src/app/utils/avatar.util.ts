export function obtenerIniciales(value: string | null | undefined, fallback = '?'): string {
  if (!value) {
    return fallback;
  }

  const partes = value
    .split(' ')
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);

  if (partes.length === 0) {
    return fallback;
  }

  const primeras = partes.slice(0, 2).map((parte) => parte[0]!.toUpperCase());
  return primeras.join('');
}

export function generarColorDesdeTexto(valor: string | null | undefined): string {
  const texto = (valor ?? '').trim();
  if (texto.length === 0) {
    return 'var(--color-primary)';
  }

  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 65;
  const lightness = 50;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

