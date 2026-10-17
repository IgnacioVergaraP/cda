import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaComponent } from './pages/lista/lista.component';
import { DetalleComponent } from './pages/detalle/detalle.component';

import { roleGuard } from '../auth/guards/role.guard';
import { RutinaBuilderComponent } from '../profesor/pages/rutina-builder/rutina-builder.component';

const routes: Routes = [
  { path: '', component: ListaComponent },
  { path: 'nueva', component: RutinaBuilderComponent, canActivate: [roleGuard(['alumno'])], data: { esAlumno: true } },
  { path: ':id', component: DetalleComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RutinasRoutingModule {}