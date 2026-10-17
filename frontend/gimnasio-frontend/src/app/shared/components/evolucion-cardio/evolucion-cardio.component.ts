import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PuntoEvolucion } from '../../../modules/progreso/models/progreso.model';

@Component({
  selector: 'app-evolucion-cardio', standalone: true, imports: [CommonModule],
  template: `
    <table *ngIf="puntos.length; else vacio">
      <caption>Cardio por día</caption>
      <thead><tr><th scope="col">Fecha</th><th scope="col">Minutos</th><th scope="col">Km</th></tr></thead>
      <tbody><tr *ngFor="let p of puntos"><td>{{ p.fecha | date:'dd/MM/yyyy':'UTC' }}</td>
        <td>{{ p.duracion_segundos ? (p.duracion_segundos / 60 | number:'1.0-2') : '—' }}</td>
        <td>{{ p.distancia_metros ? (p.distancia_metros / 1000 | number:'1.0-3') : '—' }}</td>
      </tr></tbody>
    </table>
    <ng-template #vacio><p>No hay registros de cardio todavía.</p></ng-template>`,
  styles: [`:host{display:block;overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}caption{text-align:left;padding:12px 0;color:#666}th,td{text-align:right;padding:10px 6px;border-bottom:1px solid #eee}th:first-child,td:first-child{text-align:left}`],
})
export class EvolucionCardioComponent { @Input() puntos: PuntoEvolucion[] = []; }
