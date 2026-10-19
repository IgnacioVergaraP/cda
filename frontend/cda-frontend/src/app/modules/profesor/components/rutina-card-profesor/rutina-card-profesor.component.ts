import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rutina } from '../../../rutinas/models/rutina.model';

@Component({
  selector: 'app-rutina-card-profesor',
  templateUrl: './rutina-card-profesor.component.html',
  styleUrls: ['./rutina-card-profesor.component.scss'],
})
export class RutinaCardProfesorComponent {

  @Input() rutina!: Rutina;
  @Input() mostrarAlumno = true;

  @Output() editar = new EventEmitter<Rutina>();
  @Output() archivar = new EventEmitter<Rutina>();
  @Output() reactivar = new EventEmitter<Rutina>();
  @Output() duplicar = new EventEmitter<Rutina>();

  get cantidadEjercicios(): number {
    return this.rutina?.ejercicios?.length ?? 0;
  }

  get fechaFormateada(): string {
    if (!this.rutina.fecha_creacion) return '';
    const d = new Date(this.rutina.fecha_creacion);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  onEditar(): void { this.editar.emit(this.rutina); }
  onArchivar(): void { this.archivar.emit(this.rutina); }
  onReactivar(): void { this.reactivar.emit(this.rutina); }
  onDuplicar(): void { this.duplicar.emit(this.rutina); }
}