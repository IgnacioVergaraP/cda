import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaquinasRoutingModule } from './maquinas-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ListaComponent } from './pages/lista/lista.component';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { MusculoFilterComponent } from './components/musculo-filter/musculo-filter.component';
import { MaquinaCardComponent } from './components/maquina-card/maquina-card.component';

@NgModule({
  declarations: [
    ListaComponent,
    DetalleComponent,
    MusculoFilterComponent,
    MaquinaCardComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MaquinasRoutingModule,
  ],
})
export class MaquinasModule {}