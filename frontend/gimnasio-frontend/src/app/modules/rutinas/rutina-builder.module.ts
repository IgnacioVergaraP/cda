import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { RutinaBuilderComponent } from '../profesor/pages/rutina-builder/rutina-builder.component';
import { MaquinaPickerComponent } from '../profesor/components/maquina-picker/maquina-picker.component';
import { EjercicioBuilderCardComponent } from '../profesor/components/ejercicio-builder-card/ejercicio-builder-card.component';

@NgModule({
  declarations: [RutinaBuilderComponent, MaquinaPickerComponent, EjercicioBuilderCardComponent],
  imports: [CommonModule, FormsModule, SharedModule],
  exports: [RutinaBuilderComponent],
})
export class RutinaBuilderModule {}
