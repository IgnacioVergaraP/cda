import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Mantenimiento,
  TipoMantenimiento,
  etiquetaTipoMantenimiento,
} from '../../models/analytics.model';

@Component({
  selector: 'app-mantenimiento-card',
  templateUrl: './mantenimiento-card.component.html',
  styleUrls: ['./mantenimiento-card.component.scss'],
})
export class MantenimientoCardComponent {

  @Input() mantenimiento!: Mantenimiento;
  @Input() mostrarEliminar = false;

  @Output() eliminar = new EventEmitter<Mantenimiento>();

  get tipoLabel(): string {
    return etiquetaTipoMantenimiento(this.mantenimiento.tipo);
  }

  get badgeVariant(): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
    const map: Record<TipoMantenimiento, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
      preventivo: 'primary',
      correctivo: 'danger',
      limpieza: 'success',
      revision: 'warning',
    };
    return map[this.mantenimiento.tipo];
  }

  get fechaFormateada(): string {
    const d = new Date(this.mantenimiento.fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  onEliminar(): void {
    this.eliminar.emit(this.mantenimiento);
  }
}