import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from './modules/auth/guards/auth.guard';
import { roleGuard } from './modules/auth/guards/role.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'maquinas' },

  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(m => m.AuthModule),
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['gimnasio'])],
    loadChildren: () =>
      import('./modules/admin/admin.module').then(m => m.AdminModule),
  },

  {
    path: 'maquinas',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/maquinas/maquinas.module').then(m => m.MaquinasModule),
  },
  {
    path: 'rutinas',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/rutinas/rutinas.module').then(m => m.RutinasModule),
  },
  {
    path: 'explorar',
    canActivate: [authGuard, roleGuard(['alumno'])],
    loadChildren: () => import('./modules/explorar/explorar.module').then(m => m.ExplorarModule),
  },
  {
    path: 'progreso',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/progreso/progreso.module').then(m => m.ProgresoModule),
  },
  {
    path: 'usuario',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./modules/usuario/usuario.module').then(m => m.UsuarioModule),
  },
  {
    path: 'profesor',
    canActivate: [authGuard, roleGuard(['profesor', 'gimnasio'])],
    loadChildren: () =>
      import('./modules/profesor/profesor.module').then(m => m.ProfesorModule),
  },

  { path: '**', redirectTo: 'maquinas' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}