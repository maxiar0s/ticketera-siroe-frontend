import { DatosBancarios } from '../interfaces/datos-bancarios.interface';

const limpiarValor = (valor: unknown): string | null => {
  if (valor === null || valor === undefined) {
    return null;
  }
  const texto = typeof valor === 'string' ? valor : `${valor}`;
  const trimmed = texto.trim();
  return trimmed.length ? trimmed : null;
};

const convertirEntradaAObjeto = (entrada: unknown): Record<string, unknown> | null => {
  if (!entrada) {
    return null;
  }

  if (typeof entrada === 'string') {
    const trimmed = entrada.trim();
    if (!trimmed.length) {
      return {};
    }
    try {
      return JSON.parse(trimmed);
    } catch (_error) {
      return {};
    }
  }

  if (typeof entrada === 'object') {
    return entrada as Record<string, unknown>;
  }

  return null;
};

export const normalizarDatosBancarios = (entrada: unknown): DatosBancarios | null => {
  const objeto = convertirEntradaAObjeto(entrada);
  if (!objeto) {
    return null;
  }

  const datos: DatosBancarios = {
    banco: limpiarValor(objeto['banco'] ?? objeto['nombreBanco']),
    tipoCuenta: limpiarValor(objeto['tipoCuenta'] ?? objeto['tipoCuentaBancaria']),
    numeroCuenta: limpiarValor(objeto['numeroCuenta'] ?? objeto['numeroCuentaBancaria'] ?? objeto['cuenta']),
    titular: limpiarValor(objeto['titular'] ?? objeto['titularCuenta']),
    rutTitular: limpiarValor(objeto['rutTitular'] ?? objeto['rutTitularCuenta']),
    correoNotificacion: limpiarValor(
      objeto['correoNotificacion'] ?? objeto['correoNotificacionPago'] ?? objeto['correoPago']
    ),
  };

  return tieneDatosBancarios(datos) ? datos : null;
};

export const tieneDatosBancarios = (datos?: DatosBancarios | null): boolean => {
  if (!datos) {
    return false;
  }
  return Object.values(datos).some((valor) => valor !== null && valor !== undefined && `${valor}`.trim().length > 0);
};
