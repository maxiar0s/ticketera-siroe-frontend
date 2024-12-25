import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class protegerRutaGuard {

  constructor(
    private authenticationService: AuthService,
    private router: Router
  ) {}

  canActivate():boolean {
    if (this.authenticationService.esTokenValido()) {
      return true;
    } else {
      this.router.navigate(['/auth/login']);
      return false;
    }
  }


}
