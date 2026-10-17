import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './pages/inicio/inicio.component';
import { SolicitudesComponent } from './pages/solicitudes/solicitudes.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { RutinasComponent } from './pages/rutinas/rutinas.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MaquinasListaComponent } from './pages/maquinas-lista/maquinas-lista.component';
import { MaquinaDetalleComponent } from './pages/maquina-detalle/maquina-detalle.component';

const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'solicitudes', component: SolicitudesComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'rutinas', component: RutinasComponent },
  { path: 'calendario', component: CalendarioComponent },
  { path: 'catalogo', loadChildren: () => import('../ejercicios/gestion-catalogo.module').then(m => m.GestionCatalogoModule) },
  { path: 'maquinas', component: MaquinasListaComponent },
  { path: 'maquinas/:id', component: MaquinaDetalleComponent },
  { path: 'perfil', component: PerfilComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}