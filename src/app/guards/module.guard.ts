import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { MODULES } from '../config/modules';

@Injectable({
  providedIn: 'root',
})
export class ModuleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const moduleKey = route.data['module'] as keyof typeof MODULES;

    if (moduleKey && MODULES[moduleKey] === false) {
      // Opcional: Redirigir a una página de "No autorizado" o al dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
