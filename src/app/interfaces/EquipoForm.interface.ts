import { CampoPresetOption, CampoStandard } from './campo.interface';

export interface EquipoFormField {
  id: number;
  name: string;
  label: string;
  type: string;
  placeholder?: string | null;
  required?: boolean;
  presetOptions?: CampoPresetOption[];
  standards?: CampoStandard[];
}
