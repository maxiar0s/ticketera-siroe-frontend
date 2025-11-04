export type CampoColor = 'rojo' | 'amarillo' | 'verde';

export interface CampoPresetOption {
  label: string;
  value: string;
  color: CampoColor;
}

export interface CampoStandard {
  color: CampoColor;
  label: string;
  operator?: string;
  value?: string | number | boolean | null;
  secondaryValue?: string | number | boolean | null;
  unit?: string | null;
  description?: string | null;
}

export interface Campo {
  id: number;
  name: string;
  label: string;
  type: string;
  placeholder?: string | null;
  required: boolean;
  presetOptions?: CampoPresetOption[];
  standards?: CampoStandard[];
}
