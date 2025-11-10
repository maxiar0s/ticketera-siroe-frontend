import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminComercialGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.esAdministrador() || authService.esComercial()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
