import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EstadoReporte,
  PrioridadReporte,
  Reporte,
  etiquetaPrioridad,
  etiquetaTipo,
} from '../../../modules/profesor/models/reporte.model';

@Component({
  selector: 'app-reporte-card',
  templateUrl: './reporte-card.component.html',
  styleUrls: ['./reporte-card.component.scss'],
})
export class ReporteCardComponent {

  @Input() reporte!: Reporte;
  @Input() mostrarAccionesAdmin = false;
  @Input() mostrarAccionesProfesor = false;

  @Output() cancelar = new EventEmitter<Reporte>();
  @Output() marcarEnRevision = new EventEmitter<Reporte>();
  @Output() resolver = new EventEmitter<Reporte>();

  get badgeVariant(): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
    const map: Record<EstadoReporte, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
      abierto: 'danger',
      en_revision: 'warning',
      resuelto: 'success',
      cancelado: 'neutral',
    };
    return map[this.reporte.estado];
  }

  get estadoLabel(): string {
    const map: Record<EstadoReporte, string> = {
      abierto: 'Abierto',
      en_revision: 'En revisión',
      resuelto: 'Resuelto',
      cancelado: 'Cancelado',
    };
    return map[this.reporte.estado];
  }

  get tipoLabel(): string {
    return etiquetaTipo(this.reporte.tipo);
  }

  get prioridadLabel(): string {
    return etiquetaPrioridad(this.reporte.prioridad);
  }

  get prioridadVariant(): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
    const map: Record<PrioridadReporte, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
      baja: 'neutral',
      media: 'primary',
      alta: 'warning',
      urgente: 'danger',
    };
    return map[this.reporte.prioridad];
  }

  get fechaFormateada(): string {
    const d = new Date(this.reporte.fecha_creacion);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  get puedeCancelarProfesor(): boolean {
    return this.mostrarAccionesProfesor && this.reporte.estado === 'abierto';
  }

  get puedeMarcarEnRevision(): boolean {
    return this.mostrarAccionesAdmin && this.reporte.estado === 'abierto';
  }

  get puedeResolver(): boolean {
    return this.mostrarAccionesAdmin &&
      (this.reporte.estado === 'abierto' || this.reporte.estado === 'en_revision');
  }

  onCancelar(): void { this.cancelar.emit(this.reporte); }
  onMarcarEnRevision(): void { this.marcarEnRevision.emit(this.reporte); }
  onResolver(): void { this.resolver.emit(this.reporte); }
}