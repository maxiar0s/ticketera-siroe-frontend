import { Routes } from '@angular/router';
import { protegerRutaGuard } from './guards/proteger-ruta.guard';

export const routes: Routes = [
    {
        path:'',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
      path: 'auth',
      loadChildren: () => import('./pages/auth/auth.module').then( m => m.routes),
    },
    {
      path: 'dashboard',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/dashboard/dashboard.component').then( m => m.DashboardComponent ),
    },
    {
      path: 'clientes',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/clientes/clientes.component').then( m => m.ClientesComponent ),
    },
    {
      path: 'cliente/:id',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/clientes/cliente/cliente.component').then( m => m.ClienteComponent ),
    },
    {
      path: 'sucursal',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/sucursal/sucursal.component').then( m => m.SucursalComponent ),
    },
    {
      path: 'sucursal/:id',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/sucursal/sucursal.component').then( m => m.SucursalComponent ),
    },
    {
      path: 'opciones',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/opciones/opciones.component').then( m => m.OpcionesComponent ),
    },
    {
      path: 'perfil',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/perfil/perfil.component').then( m => m.PerfilComponent ),
    },
];
