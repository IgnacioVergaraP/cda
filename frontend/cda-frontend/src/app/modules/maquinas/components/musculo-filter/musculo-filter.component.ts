import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../models/maquina.model';

@Component({
  selector: 'app-musculo-filter',
  templateUrl: './musculo-filter.component.html',
  styleUrls: ['./musculo-filter.component.scss'],
})
export class MusculoFilterComponent {

  @Input() seleccionado: string | null = null;
  @Output() seleccionadoChange = new EventEmitter<string | null>();

  readonly grupos = GRUPOS_MUSCULARES;

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  toggle(musculo: string): void {
    if (this.seleccionado === musculo) {
      this.seleccionadoChange.emit(null);
    } else {
      this.seleccionadoChange.emit(musculo);
    }
  }

  limpiar(ev: Event): void {
    ev.stopPropagation();
    this.seleccionadoChange.emit(null);
  }
}