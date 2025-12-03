import { Routes } from '@angular/router';
import { protegerRutaGuard } from './guards/proteger-ruta.guard';
import { AdminGuard } from './guards/admin-guard.guard';
import { NoClienteGuard } from './guards/no-cliente.guard';
import { ClienteGuard } from './guards/cliente.guard';
import { NoComercialGuard } from './guards/no-comercial.guard';
import { AdminComercialGuard } from './guards/admin-comercial.guard';
import { ModuleGuard } from './guards/module.guard';

export const routes: Routes = [
  // Redireccionamiento
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  // Inicio Sesión
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then((m) => m.routes),
  },

  // Home
  {
    path: 'dashboard',
    canActivate: [protegerRutaGuard, NoClienteGuard, ModuleGuard],
    data: { module: 'dashboard' },
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'dashboard-cliente',
    canActivate: [protegerRutaGuard, ClienteGuard, ModuleGuard],
    data: { module: 'dashboardCliente' },
    loadComponent: () =>
      import('./pages/dashboard-cliente/client-dashboard.component').then(
        (m) => m.ClientDashboardComponent
      ),
  },

  // Clientes
  {
    path: 'clientes',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'clientes' },
    loadComponent: () =>
      import('./pages/clientes/clientes.component').then(
        (m) => m.ClientesComponent
      ),
  },
  {
    path: 'clientes/:id',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'clientes' },
    loadComponent: () =>
      import('./pages/clientes/cliente/cliente.component').then(
        (m) => m.ClienteComponent
      ),
  },
  {
    path: 'documentacion',
    canActivate: [protegerRutaGuard, AdminComercialGuard, ModuleGuard],
    data: { module: 'documentacion' },
    loadComponent: () =>
      import('./pages/documentacion/documentacion.component').then(
        (m) => m.DocumentacionComponent
      ),
  },

  // Sucursal
  {
    path: 'clientes/:idCliente/sucursal/:id',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'sucursal' },
    loadComponent: () =>
      import('./pages/sucursal/sucursal.component').then(
        (m) => m.SucursalComponent
      ),
  },

  // Bitacoras y Tickets
  {
    path: 'bitacora',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'bitacora' },
    loadComponent: () =>
      import('./pages/bitacora/bitacora.component').then(
        (m) => m.BitacoraComponent
      ),
  },
  {
    path: 'bitacoras',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'bitacora' },
    loadComponent: () =>
      import('./pages/bitacora/bitacora.component').then(
        (m) => m.BitacoraComponent
      ),
  },
  {
    path: 'tickets',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'tickets' },
    loadComponent: () =>
      import('./pages/tickets/tickets.component').then(
        (m) => m.TicketsComponent
      ),
  },
  {
    path: 'proyectos',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'proyectos' },
    loadComponent: () =>
      import('./pages/proyectos/proyectos.component').then(
        (m) => m.ProyectosComponent
      ),
  },
  {
    path: 'vehiculos',
    canActivate: [
      protegerRutaGuard,
      NoClienteGuard,
      NoComercialGuard,
      ModuleGuard,
    ],
    data: { module: 'vehiculos' },
    loadComponent: () =>
      import('./pages/vehiculos/vehiculos.component').then(
        (m) => m.VehiculosComponent
      ),
  },

  // Config
  {
    path: 'opciones',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'opciones' },
    loadComponent: () =>
      import('./pages/opciones/opciones.component').then(
        (m) => m.OpcionesComponent
      ),
  },
  {
    path: 'perfil',
    canActivate: [protegerRutaGuard, ModuleGuard],
    data: { module: 'perfil' },
    loadComponent: () =>
      import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  // Administrador
  {
    path: 'admin/usuarios',
    canActivate: [protegerRutaGuard, AdminGuard, ModuleGuard],
    data: { module: 'adminUsuarios' },
    loadComponent: () =>
      import('./pages/admin/usuarios/usuarios.component').then(
        (m) => m.UsuariosComponent
      ),
  },
  {
    path: 'admin/tipos-equipos',
    canActivate: [protegerRutaGuard, AdminGuard, ModuleGuard],
    data: { module: 'adminTiposEquipos' },
    loadComponent: () =>
      import('./pages/admin/tipos-equipos/tipos-equipos.component').then(
        (m) => m.TiposEquiposComponent
      ),
  },
];
