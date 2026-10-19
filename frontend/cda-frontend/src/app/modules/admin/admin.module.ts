import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { InicioComponent } from './pages/inicio/inicio.component';
import { SolicitudesComponent } from './pages/solicitudes/solicitudes.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { RutinasComponent } from './pages/rutinas/rutinas.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MaquinasListaComponent } from './pages/maquinas-lista/maquinas-lista.component';
import { MaquinaDetalleComponent } from './pages/maquina-detalle/maquina-detalle.component';

import { CalendarioGridComponent } from './components/calendario-grid/calendario-grid.component';
import { UsoCardComponent } from './components/uso-card/uso-card.component';
import { MantenimientoCardComponent } from './components/mantenimiento-card/mantenimiento-card.component';

@NgModule({
  declarations: [
    InicioComponent,
    SolicitudesComponent,
    ReportesComponent,
    RutinasComponent,
    PerfilComponent,
    CalendarioComponent,
    DashboardComponent,
    MaquinasListaComponent,
    MaquinaDetalleComponent,
    CalendarioGridComponent,
    UsoCardComponent,
    MantenimientoCardComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}