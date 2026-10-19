import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PrincipalComponent } from './pages/principal/principal.component';
import { RegistrarComponent } from './pages/registrar/registrar.component';
import { SeleccionarEjercicioComponent } from './pages/seleccionar-ejercicio/seleccionar-ejercicio.component';

const routes: Routes = [
  { path: '', component: PrincipalComponent },
  { path: 'seleccionar-ejercicio', component: SeleccionarEjercicioComponent },
  { path: 'registrar', component: RegistrarComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProgresoRoutingModule {}