import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RutinaBuilderModule } from './rutina-builder.module';
import { RutinasRoutingModule } from './rutinas-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ListaComponent } from './pages/lista/lista.component';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { RutinaCardComponent } from './components/rutina-card/rutina-card.component';
import { EjercicioItemComponent } from './components/ejercicio-item/ejercicio-item.component';
import { SolicitudRutinaAlumnoComponent } from './components/solicitud-rutina-alumno/solicitud-rutina-alumno.component';

@NgModule({
  declarations: [
    ListaComponent,
    DetalleComponent,
    RutinaCardComponent,
    EjercicioItemComponent,
    SolicitudRutinaAlumnoComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RutinasRoutingModule,
    RutinaBuilderModule,
  ],
})
export class RutinasModule {}