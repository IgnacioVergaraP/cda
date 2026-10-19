import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metrica-card',
  templateUrl: './metrica-card.component.html',
  styleUrls: ['./metrica-card.component.scss'],
})
export class MetricaCardComponent {

  @Input() icono = 'bi-graph-up';
  @Input() label = '';
  @Input() valor: number | string = 0;
  @Input() sufijo = '';
}