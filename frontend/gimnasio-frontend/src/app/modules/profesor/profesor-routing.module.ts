import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './pages/inicio/inicio.component';
import { ListaAlumnosComponent } from './pages/lista-alumnos/lista-alumnos.component';
import { DetalleAlumnoComponent } from './pages/detalle-alumno/detalle-alumno.component';
import { SubirEjercicioComponent } from './pages/subir-ejercicio/subir-ejercicio.component';
import { ReportarComponent } from './pages/reportar/reportar.component';
import { PerfilProfesorComponent } from './pages/perfil-profesor/perfil-profesor.component';
import { SolicitudesRutinaComponent } from './pages/solicitudes-rutina/solicitudes-rutina.component';
import { RutinasListaComponent } from './pages/rutinas-lista/rutinas-lista.component';
import { RutinaBuilderComponent } from './pages/rutina-builder/rutina-builder.component';
import { MisHorariosComponent } from './pages/mis-horarios/mis-horarios.component';

import { CatalogoComponent } from '../explorar/pages/catalogo/catalogo.component';
import { DetalleComponent } from '../rutinas/pages/detalle/detalle.component';

const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'alumnos', component: ListaAlumnosComponent },
  { path: 'alumnos/:id', component: DetalleAlumnoComponent },
  { path: 'rutinas', component: RutinasListaComponent },
  { path: 'rutinas/nueva', component: RutinaBuilderComponent },
  { path: 'rutinas/:id/editar', component: RutinaBuilderComponent },
  { path: 'rutinas/:id/duplicar', component: RutinaBuilderComponent },
  { path: 'publicaciones', component: CatalogoComponent, data: { gestion: true } },
  { path: 'publicaciones/nueva', component: RutinaBuilderComponent, data: { esPublica: true } },
  { path: 'publicaciones/:id/editar', component: RutinaBuilderComponent, data: { esPublica: true } },
  { path: 'publicaciones/:id/ver', component: DetalleComponent, data: { esPublica: true, gestion: true } },
  { path: 'subir', component: SubirEjercicioComponent },
  { path: 'reportar', component: ReportarComponent },
  { path: 'solicitudes-rutina', component: SolicitudesRutinaComponent },
  { path: 'mis-horarios', component: MisHorariosComponent },
  { path: 'perfil', component: PerfilProfesorComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfesorRoutingModule {}