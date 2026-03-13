import { Injectable } from '@angular/core';
import { Cuenta } from '../interfaces/Cuenta.interface';
import {
  ModuleAccessMap,
  resolveEffectiveModuleAccess,
} from '../config/modules';

@Injectable({
  providedIn: 'root',
})
export class ModuleAccessService {
  private effectiveModules: ModuleAccessMap = resolveEffectiveModuleAccess();

  hydrateFromPerfil(
    perfil?: Pick<Cuenta, 'modulosAcceso' | 'ocupacion'> | null,
  ): ModuleAccessMap {
    this.effectiveModules = resolveEffectiveModuleAccess(
      perfil?.modulosAcceso,
      perfil?.ocupacion,
    );
    return this.getSnapshot();
  }

  getSnapshot(): ModuleAccessMap {
    return { ...this.effectiveModules };
  }

  clear(): void {
    this.effectiveModules = resolveEffectiveModuleAccess();
  }
}
