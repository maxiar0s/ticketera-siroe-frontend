import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { catchError, map, of, Observable } from 'rxjs';
import { MODULES } from '../config/modules';
import { ApiService } from '../services/api.service';
import { ModuleAccessService } from '../services/module-access.service';

@Injectable({
  providedIn: 'root',
})
export class ModuleGuard implements CanActivate {
  constructor(
    private router: Router,
    private apiService: ApiService,
    private moduleAccessService: ModuleAccessService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const moduleKey = route.data['module'] as keyof typeof MODULES;

    if (!moduleKey) {
      return of(true);
    }

    const resolverAcceso = (): boolean => {
      const modules = this.moduleAccessService.getSnapshot();
      if (modules[moduleKey] === false) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    };

    return this.apiService.perfilActual().pipe(
      map((perfil) => {
        this.moduleAccessService.hydrateFromPerfil(perfil);
        return resolverAcceso();
      }),
      catchError(() => of(resolverAcceso())),
    );
  }
}
