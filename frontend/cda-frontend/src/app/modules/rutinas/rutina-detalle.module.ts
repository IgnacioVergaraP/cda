import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { EjercicioItemComponent } from './components/ejercicio-item/ejercicio-item.component';

@NgModule({
  declarations: [DetalleComponent, EjercicioItemComponent],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [DetalleComponent],
})
export class RutinaDetalleModule {}
