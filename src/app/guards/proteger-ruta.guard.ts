import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class protegerRutaGuard {
  constructor(private router: Router) {}

  canActivate():boolean {
    const token = localStorage.getItem('token');
    if (token && !this.tokenExpirado(token)) {
      return true;
    }
    this.router.navigate(['auth/login']);
    return false;
  }

  private tokenExpirado(token: string):boolean {
    try {
      const decoded:any = jwtDecode(token);
      console.log(decoded);
      const tiempoActual = Math.floor(Date.now() / 1000);
      return decoded.exp < tiempoActual;
    } catch (error) {
      return true;
    }
  }
}
