import { Routes } from '@angular/router';
import { protegerRutaGuard } from './guards/proteger-ruta.guard';
import { AdminGuard } from './guards/admin-guard.guard';
import { NoClienteGuard } from './guards/no-cliente.guard';
import { ClienteGuard } from './guards/cliente.guard';
import { NoComercialGuard } from './guards/no-comercial.guard';

export const routes: Routes = [
  // Redireccionamiento
  {
      path:'',
      redirectTo: 'dashboard',
      pathMatch: 'full'
  },
  // Inicio Sesión
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then( m => m.routes),
  },

  // Home
  {
    path: 'dashboard',
    canActivate: [protegerRutaGuard, NoClienteGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then( m => m.DashboardComponent ),
  },
  {
    path: 'dashboard-cliente',
    canActivate: [protegerRutaGuard, ClienteGuard],
    loadComponent: () => import('./pages/dashboard-cliente/client-dashboard.component').then( m => m.ClientDashboardComponent ),
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

  // Bitacora
  {
    path: 'bitacora',
    canActivate: [protegerRutaGuard],
    loadComponent: () => import('./pages/bitacora/bitacora.component').then( m => m.BitacoraComponent ),
  },
  {
    path: 'proyectos',
    canActivate: [protegerRutaGuard],
    loadComponent: () => import('./pages/proyectos/proyectos.component').then( m => m.ProyectosComponent ),
  },
  {
    path: 'vehiculos',
    canActivate: [protegerRutaGuard, NoClienteGuard, NoComercialGuard],
    loadComponent: () =>
      import('./pages/vehiculos/vehiculos.component').then(
        (m) => m.VehiculosComponent
      ),
  },

  // Config
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
  // Administrador
  {
    path: 'admin/usuarios',
    canActivate: [protegerRutaGuard, AdminGuard],
    loadComponent: () => import('./pages/admin/usuarios/usuarios.component').then( m => m.UsuariosComponent ),
  },
  {
    path: 'admin/tipos-equipos',
    canActivate: [protegerRutaGuard, AdminGuard],
    loadComponent: () =>
      import('./pages/admin/tipos-equipos/tipos-equipos.component').then(
        (m) => m.TiposEquiposComponent
      ),
  },
];
