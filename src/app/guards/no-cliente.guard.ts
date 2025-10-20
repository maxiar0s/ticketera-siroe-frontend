import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const NoClienteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.esCliente()) {
    router.navigate(['/dashboard-cliente']);
    return false;
  }

  return true;
};
