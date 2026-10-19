import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  ObjetivoRutina,
  SolicitudRutina,
  etiquetaObjetivo,
} from '../../../profesor/models/solicitud-rutina.model';

@Component({
  selector: 'app-solicitud-rutina-alumno',
  templateUrl: './solicitud-rutina-alumno.component.html',
  styleUrls: ['./solicitud-rutina-alumno.component.scss'],
})
export class SolicitudRutinaAlumnoComponent implements OnChanges {

  @Input() solicitudes: SolicitudRutina[] = [];

  @Output() pedirRutina = new EventEmitter<void>();
  @Output() cancelarSolicitud = new EventEmitter<SolicitudRutina>();

  activa: SolicitudRutina | null = null;
  ultimaResuelta: SolicitudRutina | null = null;
  ultimaRechazada: SolicitudRutina | null = null;

  ngOnChanges(_: SimpleChanges): void {
    this.calcularEstado();
  }

  private calcularEstado(): void {
    // Buscamos una activa (pendiente o en_proceso)
    this.activa = this.solicitudes.find(s =>
      s.estado === 'pendiente' || s.estado === 'en_proceso',
    ) ?? null;

    // Si no hay activa, mostramos la última resuelta (para que vea la info)
    if (!this.activa) {
      this.ultimaResuelta = this.solicitudes.find(s => s.estado === 'resuelta') ?? null;
      this.ultimaRechazada = this.solicitudes.find(s => s.estado === 'rechazada') ?? null;
    } else {
      this.ultimaResuelta = null;
      this.ultimaRechazada = null;
    }
  }

  get mostrarPedirRutina(): boolean {
    return !this.activa && !this.ultimaResuelta;
  }

  get mostrarCancelar(): boolean {
    return this.activa !== null && (this.activa.estado === 'pendiente' || this.activa.estado === 'en_proceso');
  }

  get objetivoLegible(): string {
    return this.activa ? etiquetaObjetivo(this.activa.objetivo) : '';
  }

  get estadoTexto(): string {
    if (!this.activa) return '';
    if (this.activa.estado === 'pendiente') {
      return this.activa.profesor_preferido_nombre
        ? `Esperando respuesta de ${this.activa.profesor_preferido_nombre}`
        : 'En la fila, un profesor la va a tomar';
    }
    if (this.activa.estado === 'en_proceso') {
      return `${this.activa.profesor_nombre} está coordinando tu rutina`;
    }
    return '';
  }

  get estadoIcono(): string {
    if (!this.activa) return '';
    return this.activa.estado === 'pendiente' ? 'bi-hourglass-split' : 'bi-person-check';
  }

  onPedirRutina(): void {
    this.pedirRutina.emit();
  }

  onCancelar(): void {
    if (this.activa) this.cancelarSolicitud.emit(this.activa);
  }
}