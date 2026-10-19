import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProgresoRoutingModule } from './progreso-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { PrincipalComponent } from './pages/principal/principal.component';
import { RegistrarComponent } from './pages/registrar/registrar.component';
import { SeleccionarEjercicioComponent } from './pages/seleccionar-ejercicio/seleccionar-ejercicio.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { MetricasRegistroComponent } from './components/metricas-registro/metricas-registro.component';
import { EjercicioPickerComponent } from '../profesor/components/ejercicio-picker/ejercicio-picker.component';

@NgModule({
  declarations: [
    PrincipalComponent,
    RegistrarComponent,
    SeleccionarEjercicioComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ProgresoRoutingModule,
    MetricasRegistroComponent,
    StepperComponent,
    EjercicioPickerComponent,
  ],
})
export class ProgresoModule {}
