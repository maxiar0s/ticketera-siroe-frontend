export const MODULES = {
  dashboard: true,
  calendario: true,
  dashboardCliente: true,
  clientes: true,
  sucursal: false,
  bitacora: false,
  tickets: true,
  biblioteca: true,
  vehiculos: false,
  inventario: false,
  opciones: true,
  perfil: true,
  adminUsuarios: true,
  adminTiposEquipos: false,
  reportes: true,
} as const;

export type ModuleKey = keyof typeof MODULES;
export type ModuleAccessMap = Record<ModuleKey, boolean>;

export const OCCUPATIONS = [
  'Software',
  'Terreno',
  'Software/Terreno',
] as const;

export type Occupation = (typeof OCCUPATIONS)[number];

export const normalizeOccupationLabel = (
  occupation?: string | null,
): Occupation | null => {
  if (!occupation) {
    return null;
  }

  if (occupation === 'Tecnico de Software') {
    return 'Software';
  }

  if (occupation === 'Tecnico en Terreno') {
    return 'Terreno';
  }

  return OCCUPATIONS.includes(occupation as Occupation)
    ? (occupation as Occupation)
    : null;
};

export const MODULE_ORDER: ModuleKey[] = [
  'dashboard',
  'calendario',
  'dashboardCliente',
  'clientes',
  'sucursal',
  'bitacora',
  'tickets',
  'biblioteca',
  'vehiculos',
  'inventario',
  'opciones',
  'perfil',
  'adminUsuarios',
  'adminTiposEquipos',
  'reportes',
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  calendario: 'Calendario',
  dashboardCliente: 'Dashboard cliente',
  clientes: 'Clientes',
  sucursal: 'Sucursales',
  bitacora: 'Bitacoras',
  tickets: 'Tickets',
  biblioteca: 'Biblioteca',
  vehiculos: 'Vehiculos',
  inventario: 'Inventario',
  opciones: 'Opciones',
  perfil: 'Perfil',
  adminUsuarios: 'Usuarios',
  adminTiposEquipos: 'Tipos de equipos',
  reportes: 'Reportes',
};

export interface ModuleGroupConfig {
  id: string;
  label: string;
  children: ModuleKey[];
  moduleKey?: ModuleKey;
}

export const MODULE_GROUPS: ModuleGroupConfig[] = [
  {
    id: 'administracion',
    label: 'Administracion',
    children: ['adminUsuarios', 'adminTiposEquipos', 'opciones', 'perfil'],
  },
];

export const STANDALONE_MODULE_KEYS: ModuleKey[] = [
  'dashboard',
  'clientes',
  'sucursal',
  'bitacora',
  'tickets',
  'calendario',
  'reportes',
  'biblioteca',
  'vehiculos',
  'inventario',
];

export const buildDefaultModuleAccess = (
  enabled = true,
): ModuleAccessMap => {
  return MODULE_ORDER.reduce((accumulator, moduleKey) => {
    accumulator[moduleKey] = enabled;
    return accumulator;
  }, {} as ModuleAccessMap);
};

export const buildModuleAccessByOccupation = (
  occupation?: string | null,
): ModuleAccessMap => {
  const normalized = buildDefaultModuleAccess(true);
  const normalizedOccupation = normalizeOccupationLabel(occupation);

  if (normalizedOccupation === 'Software') {
    normalized.clientes = false;
    normalized.sucursal = false;
    normalized.bitacora = false;
    normalized.vehiculos = false;
    normalized.inventario = false;
    normalized.adminTiposEquipos = false;
    return normalized;
  }

  if (normalizedOccupation === 'Terreno') {
    normalized.biblioteca = false;
    return normalized;
  }

  return normalized;
};

export const normalizeModuleAccess = (
  rawValue?: Partial<Record<string, unknown>> | null,
  fallbackValue: ModuleAccessMap = buildDefaultModuleAccess(true),
): ModuleAccessMap => {
  const normalized = { ...fallbackValue };

  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return normalized;
  }

  MODULE_ORDER.forEach((moduleKey) => {
    const rawEntry = rawValue[moduleKey];
    if (typeof rawEntry === 'boolean') {
      normalized[moduleKey] = rawEntry;
      return;
    }

    if (typeof rawEntry === 'number') {
      normalized[moduleKey] = rawEntry === 1;
      return;
    }

    if (typeof rawEntry === 'string') {
      const value = rawEntry.trim().toLowerCase();
      if (['true', '1', 'si', 'sí', 'yes'].includes(value)) {
        normalized[moduleKey] = true;
      } else if (['false', '0', 'no'].includes(value)) {
        normalized[moduleKey] = false;
      }
    }
  });

  return normalized;
};

export const resolveEffectiveModuleAccess = (
  rawValue?: Partial<Record<string, unknown>> | null,
  occupation?: string | null,
): ModuleAccessMap => {
  const fallbackModules = buildModuleAccessByOccupation(occupation);

  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return normalizeModuleAccess(MODULES, fallbackModules);
  }

  return normalizeModuleAccess(rawValue, fallbackModules);
};
