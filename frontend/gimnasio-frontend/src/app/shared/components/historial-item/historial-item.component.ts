import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HistorialFila } from '../../../modules/progreso/models/progreso.model';

@Component({
  selector: 'app-historial-item',
  templateUrl: './historial-item.component.html',
  styleUrls: ['./historial-item.component.scss'],
})
export class HistorialItemComponent {

  @Input() fila!: HistorialFila;

  @Output() verEvolucion = new EventEmitter<HistorialFila>();
  @Output() editarSesion = new EventEmitter<HistorialFila>();

  get icono(): string {
    if (this.fila.modalidad === 'cardio') return 'bi-heart-pulse';
    return this.fila.ejercicio_tipo === 'maquina' ? 'bi-gear' : 'bi-lightning';
  }

  get fechaFormateada(): string {
    return this.formatearFecha(this.fila.fecha);
  }

  onVerEvolucion(): void {
    this.verEvolucion.emit(this.fila);
  }

  onEditar(ev: Event): void {
    ev.stopPropagation();
    this.editarSesion.emit(this.fila);
  }

  private formatearFecha(iso: string): string {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const mismoDia = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (mismoDia(d, hoy)) return 'Hoy';
    if (mismoDia(d, ayer)) return 'Ayer';

    const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
  }
}