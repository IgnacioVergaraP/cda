import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Horario, nombreDia } from '../../../modules/admin/models/horario.model';

interface DiaConHorarios {
  dia: number;
  nombre: string;
  horarios: Horario[];
}

@Component({
  selector: 'app-calendario-lista',
  templateUrl: './calendario-lista.component.html',
  styleUrls: ['./calendario-lista.component.scss'],
})
export class CalendarioListaComponent {

  @Input() horarios: Horario[] = [];

  @Output() horarioClick = new EventEmitter<Horario>();

  get dias(): DiaConHorarios[] {
    const result: DiaConHorarios[] = [];
    for (let dia = 0; dia <= 6; dia++) {
      const items = this.horarios
        .filter(h => h.dia_semana === dia)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      result.push({ dia, nombre: nombreDia(dia), horarios: items });
    }
    return result;
  }

  onHorarioClick(h: Horario): void {
    this.horarioClick.emit(h);
  }
}