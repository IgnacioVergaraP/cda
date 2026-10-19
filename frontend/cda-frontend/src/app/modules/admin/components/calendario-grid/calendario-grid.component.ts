import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DIAS_SEMANA, Horario, nombreDia } from '../../models/horario.model';

/** Franja de 4 horas dentro de la grilla. */
interface Franja {
  inicio: number;   // hora de inicio (8, 12, 16, 20)
  fin: number;      // hora de fin (12, 16, 20, 22)
  label: string;
}

interface CeldaGrilla {
  dia: number;
  franja: Franja;
  horarios: Horario[];
}

@Component({
  selector: 'app-calendario-grid',
  templateUrl: './calendario-grid.component.html',
  styleUrls: ['./calendario-grid.component.scss'],
})
export class CalendarioGridComponent {

  @Input() horarios: Horario[] = [];
  @Input() mostrarProfesor = true;

  @Output() celdaClick = new EventEmitter<{ dia: number; franja: Franja; horarios: Horario[] }>();

  // Franjas horarias de la grilla
  readonly franjas: Franja[] = [
    { inicio: 8,  fin: 12, label: '08 - 12' },
    { inicio: 12, fin: 16, label: '12 - 16' },
    { inicio: 16, fin: 20, label: '16 - 20' },
    { inicio: 20, fin: 22, label: '20 - 22' },
  ];

  readonly dias = DIAS_SEMANA;

  /** Devuelve los horarios que caen (parcial o totalmente) dentro de la franja y el día. */
  horariosEn(dia: number, franja: Franja): Horario[] {
    return this.horarios.filter(h => {
      if (h.dia_semana !== dia) return false;
      const hInicio = this.parseHora(h.hora_inicio);
      const hFin = this.parseHora(h.hora_fin);
      // Se solapan si el inicio de uno es menor al fin del otro
      return hInicio < franja.fin && hFin > franja.inicio;
    });
  }

  /** Construye la lista completa de celdas para el template. */
  get celdas(): CeldaGrilla[] {
    const result: CeldaGrilla[] = [];
    for (const franja of this.franjas) {
      for (const dia of this.dias) {
        result.push({
          dia: dia.value,
          franja,
          horarios: this.horariosEn(dia.value, franja),
        });
      }
    }
    return result;
  }

  /** Devuelve la celda para un día/franja específico (usado en el template con *ngFor anidado). */
  celda(dia: number, franja: Franja): CeldaGrilla {
    return { dia, franja, horarios: this.horariosEn(dia, franja) };
  }

  onCeldaClick(dia: number, franja: Franja): void {
    const horarios = this.horariosEn(dia, franja);
    this.celdaClick.emit({ dia, franja, horarios });
  }

  nombreDiaCorto(dia: number): string {
    return nombreDia(dia, true);
  }

  private parseHora(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
  }
}