import { etiquetaCategoria } from '../../../modules/ejercicios/models/catalogo.model';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EstadoSolicitud, Solicitud } from '../../../modules/profesor/models/solicitud.model';

@Component({
  selector: 'app-solicitud-card',
  templateUrl: './solicitud-card.component.html',
  styleUrls: ['./solicitud-card.component.scss'],
})
export class SolicitudCardComponent {

  readonly etiquetaCategoria = etiquetaCategoria;
  @Input() solicitud!: Solicitud;
  @Input() mostrarAcciones = false;

  @Output() cancelar = new EventEmitter<Solicitud>();
  @Output() aprobar = new EventEmitter<Solicitud>();
  @Output() rechazar = new EventEmitter<Solicitud>();

  get badgeVariant(): 'neutral' | 'primary' | 'success' | 'warning' | 'danger' {
    const map: Record<EstadoSolicitud, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
      pendiente: 'warning',
      aprobada: 'success',
      rechazada: 'danger',
      cancelada: 'neutral',
    };
    return map[this.solicitud.estado];
  }

  get estadoLabel(): string {
    const map: Record<EstadoSolicitud, string> = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
    };
    return map[this.solicitud.estado];
  }

  get fechaFormateada(): string {
    const d = new Date(this.solicitud.fecha_creacion);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  get puedeCancelar(): boolean {
    return this.solicitud.estado === 'pendiente';
  }

  onCancelar(): void { this.cancelar.emit(this.solicitud); }
  onAprobar(): void { this.aprobar.emit(this.solicitud); }
  onRechazar(): void { this.rechazar.emit(this.solicitud); }
}