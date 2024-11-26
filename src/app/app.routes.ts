import { Routes } from '@angular/router';

export const routes: Routes = [
      {
        path:'',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
      path: 'dashboard',
      loadComponent: () => import('./pages/dashboard/dashboard.component').then( m => m.DashboardComponent ),
    },
    {
      path: 'clientes',
      loadComponent: () => import('./pages/clientes/clientes.component').then( m => m.ClientesComponent ),
    },
    {
      path: 'cliente/:id',
      loadComponent: () => import('./pages/cliente/cliente.component').then( m => m.ClienteComponent ),
    },
    {
      path: 'cliente/:id/sucursal/:id',
      loadComponent: () => import('./pages/sucursal/sucursal.component').then( m => m.SucursalComponent ),
    },
    {
      path: 'opciones',
      loadComponent: () => import('./pages/opciones/opciones.component').then( m => m.OpcionesComponent ),
    },
    {
      path: 'perfil',
      loadComponent: () => import('./pages/perfil/perfil.component').then( m => m.PerfilComponent ),
    },
];
