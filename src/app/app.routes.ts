import { Routes } from '@angular/router';
import { protegerRutaGuard } from './guards/proteger-ruta.guard';

export const routes: Routes = [
    {
        path:'',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    // Auth routes
    // {
    //   path: 'auth/login',
    //   loadComponent: () => import('./pages/auth/login/login.component').then( m => m.LoginComponent),
    // },
    {
      path: 'auth',
      loadChildren: () => import('./pages/auth/auth.module').then( m => m.routes),
    },

    // Index
    {
      path: 'dashboard',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/dashboard/dashboard.component').then( m => m.DashboardComponent ),
    },

    // Clientes
    {
      path: 'clientes',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/clientes/clientes.component').then( m => m.ClientesComponent ),
    },
    {
      path: 'clientes/:id',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/clientes/cliente/cliente.component').then( m => m.ClienteComponent ),
    },

    // Sucursal
    {
      path: 'clientes/:idCliente/sucursal/:id',
      canActivate: [protegerRutaGuard],
      loadComponent: () => import('./pages/sucursal/sucursal.component').then( m => m.SucursalComponent ),
    },

    // Conf
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
