import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// UI genéricos
import { UiInputComponent } from './components/ui-input/ui-input.component';
import { UiButtonComponent } from './components/ui-button/ui-button.component';
import { UiCardComponent } from './components/ui-card/ui-card.component';
import { UiBadgeComponent } from './components/ui-badge/ui-badge.component';
import { UiEmptyStateComponent } from './components/ui-empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from './components/ui-page-header/ui-page-header.component';
import { UiBackButtonComponent } from './components/ui-back-button/ui-back-button.component';
import { UiSheetComponent } from './components/ui-sheet/ui-sheet.component';

// Componentes de dominio
import { AvatarComponent } from './components/avatar/avatar.component';
import { MetricaCardComponent } from './components/metrica-card/metrica-card.component';
import { PerfilHeaderComponent } from './components/perfil-header/perfil-header.component';
import { GraficoEvolucionComponent } from './components/grafico-evolucion/grafico-evolucion.component';
import { HistorialItemComponent } from './components/historial-item/historial-item.component';
import { SolicitudCardComponent } from './components/solicitud-card/solicitud-card.component';
import { ReporteCardComponent } from './components/reporte-card/reporte-card.component';
import { SolicitudRutinaCardComponent } from './components/solicitud-rutina-card/solicitud-rutina-card.component';
import { CalendarioListaComponent } from './components/calendario-lista/calendario-lista.component';
import { MuscleMapComponent } from './components/muscle-map/muscle-map.component';
import { EvolucionCardioComponent } from './components/evolucion-cardio/evolucion-cardio.component';

@NgModule({
  declarations: [
    UiInputComponent,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiPageHeaderComponent,
    UiBackButtonComponent,
    UiSheetComponent,
    AvatarComponent,
    MetricaCardComponent,
    PerfilHeaderComponent,
    GraficoEvolucionComponent,
    HistorialItemComponent,
    SolicitudCardComponent,
    ReporteCardComponent,
    SolicitudRutinaCardComponent,
    CalendarioListaComponent,
    MuscleMapComponent,
  ],
  imports: [
    EvolucionCardioComponent,
    CommonModule,
    RouterModule,
  ],
  exports: [
    EvolucionCardioComponent,
    UiInputComponent,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiPageHeaderComponent,
    UiBackButtonComponent,
    UiSheetComponent,
    AvatarComponent,
    MetricaCardComponent,
    PerfilHeaderComponent,
    GraficoEvolucionComponent,
    HistorialItemComponent,
    SolicitudCardComponent,
    ReporteCardComponent,
    SolicitudRutinaCardComponent,
    CalendarioListaComponent,
    MuscleMapComponent,
  ],
})
export class SharedModule {}
