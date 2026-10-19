import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EstadoSolicitudRutina,
  SolicitudRutina,
  etiquetaObjetivo,
} from '../../../modules/profesor/models/solicitud-rutina.model';

@Component({
  selector: 'app-solicitud-rutina-card',
  templateUrl: './solicitud-rutina-card.component.html',
  styleUrls: ['./solicitud-rutina-card.component.scss'],
})
export class SolicitudRutinaCardComponent {

  @Input() solicitud!: SolicitudRutina;
  @Input() mostrarAcciones = false;
  @Input() modoProfesor = false;

  @Output() tomar = new EventEmitter<SolicitudRutina>();
  @Output() resolver = new EventEmitter<SolicitudRutina>();
  @Output() rechazar = new EventEmitter<SolicitudRutina>();
  @Output() solicitarLiberacion = new EventEmitter<SolicitudRutina>();

  get badgeVariant(): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
    const map: Record<EstadoSolicitudRutina, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
      pendiente: 'warning',
      en_proceso: 'primary',
      resuelta: 'success',
      rechazada: 'danger',
      cancelada: 'neutral',
    };
    return map[this.solicitud.estado];
  }

  get estadoLabel(): string {
    const map: Record<EstadoSolicitudRutina, string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      resuelta: 'Resuelta',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
    };
    return map[this.solicitud.estado];
  }

  get objetivoLabel(): string {
    return etiquetaObjetivo(this.solicitud.objetivo);
  }

  get fechaFormateada(): string {
    const d = new Date(this.solicitud.fecha_creacion);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  get puedeTomar(): boolean {
    return this.mostrarAcciones && this.solicitud.estado === 'pendiente';
  }

  get puedeResolver(): boolean {
    return this.modoProfesor && this.solicitud.estado === 'en_proceso';
  }

  get liberacionSolicitada(): boolean {
    return this.solicitud.estado_liberacion === 'solicitada';
  }

  onTomar(): void { this.tomar.emit(this.solicitud); }
  onResolver(): void { this.resolver.emit(this.solicitud); }
  onRechazar(): void { this.rechazar.emit(this.solicitud); }
  onSolicitarLiberacion(): void { this.solicitarLiberacion.emit(this.solicitud); }
}