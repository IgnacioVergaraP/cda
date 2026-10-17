import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { DetalleComponent } from '../rutinas/pages/detalle/detalle.component';
import { RutinaDetalleModule } from '../rutinas/rutina-detalle.module';

@NgModule({
  imports: [CatalogoComponent, RutinaDetalleModule, RouterModule.forChild([
    { path: '', component: CatalogoComponent },
    { path: ':id', component: DetalleComponent, data: { esPublica: true } },
  ])],
})
export class ExplorarModule {}
