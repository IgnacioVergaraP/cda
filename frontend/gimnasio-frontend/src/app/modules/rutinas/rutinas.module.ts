import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RutinaDetalleModule } from './rutina-detalle.module';
import { RutinaBuilderModule } from './rutina-builder.module';
import { RutinasRoutingModule } from './rutinas-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ListaComponent } from './pages/lista/lista.component';
import { RutinaCardComponent } from './components/rutina-card/rutina-card.component';
import { SolicitudRutinaAlumnoComponent } from './components/solicitud-rutina-alumno/solicitud-rutina-alumno.component';

@NgModule({
  declarations: [
    ListaComponent,
    RutinaCardComponent,
    SolicitudRutinaAlumnoComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RutinasRoutingModule,
    RutinaBuilderModule,
    RutinaDetalleModule,
  ],
})
export class RutinasModule {}