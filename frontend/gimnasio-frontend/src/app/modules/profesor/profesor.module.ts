import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RutinaBuilderModule } from '../rutinas/rutina-builder.module';
import { CatalogoComponent } from '../explorar/pages/catalogo/catalogo.component';
import { RutinaDetalleModule } from '../rutinas/rutina-detalle.module';
import { ProfesorRoutingModule } from './profesor-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { InicioComponent } from './pages/inicio/inicio.component';
import { ListaAlumnosComponent } from './pages/lista-alumnos/lista-alumnos.component';
import { DetalleAlumnoComponent } from './pages/detalle-alumno/detalle-alumno.component';
import { SubirEjercicioComponent } from './pages/subir-ejercicio/subir-ejercicio.component';
import { ReportarComponent } from './pages/reportar/reportar.component';
import { PerfilProfesorComponent } from './pages/perfil-profesor/perfil-profesor.component';
import { SolicitudesRutinaComponent } from './pages/solicitudes-rutina/solicitudes-rutina.component';
import { RutinasListaComponent } from './pages/rutinas-lista/rutinas-lista.component';
import { MisHorariosComponent } from './pages/mis-horarios/mis-horarios.component';

import { AlumnoCardComponent } from './components/alumno-card/alumno-card.component';
import { RutinaCardProfesorComponent } from './components/rutina-card-profesor/rutina-card-profesor.component';
import { TabPerfilComponent } from './components/detalle-alumno-tabs/tab-perfil/tab-perfil.component';
import { TabRutinasComponent } from './components/detalle-alumno-tabs/tab-rutinas/tab-rutinas.component';
import { TabProgresoComponent } from './components/detalle-alumno-tabs/tab-progreso/tab-progreso.component';
import { TabSolicitudesComponent } from './components/detalle-alumno-tabs/tab-solicitudes/tab-solicitudes.component';

@NgModule({
  declarations: [
    InicioComponent,
    ListaAlumnosComponent,
    DetalleAlumnoComponent,
    SubirEjercicioComponent,
    ReportarComponent,
    PerfilProfesorComponent,
    SolicitudesRutinaComponent,
    RutinasListaComponent,
    MisHorariosComponent,
    AlumnoCardComponent,
    RutinaCardProfesorComponent,
    TabPerfilComponent,
    TabRutinasComponent,
    TabProgresoComponent,
    TabSolicitudesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ProfesorRoutingModule,
    RutinaBuilderModule,
    CatalogoComponent,
    RutinaDetalleModule,
  ],
})
export class ProfesorModule {}