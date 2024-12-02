import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then( m => m.LoginComponent ),
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout/logout.component').then( m => m.LogoutComponent ),
  }
]
