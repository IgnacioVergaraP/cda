import { Component, Input } from '@angular/core';
import { RecursoUso } from '../../models/analytics.model';
import { etiquetaRecurso } from '../../../ejercicios/models/catalogo.model';

@Component({ selector: 'app-uso-card', templateUrl: './uso-card.component.html', styleUrls: ['./uso-card.component.scss'] })
export class UsoCardComponent {
  @Input() recurso!: RecursoUso;
  @Input() maximo = 1;
  @Input() variante: 'top' | 'baja' = 'top';
  readonly etiquetaRecurso = etiquetaRecurso;
  get porcentaje(): number {
    return this.maximo > 0 ? Math.max(0, Math.min(100, this.recurso.cantidad_registros / this.maximo * 100)) : 0;
  }
}
