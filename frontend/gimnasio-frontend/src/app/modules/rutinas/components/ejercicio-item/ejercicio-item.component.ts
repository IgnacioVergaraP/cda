import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ejercicio } from '../../models/rutina.model';

@Component({
  selector: 'app-ejercicio-item',
  templateUrl: './ejercicio-item.component.html',
  styleUrls: ['./ejercicio-item.component.scss'],
})
export class EjercicioItemComponent {

  @Input() ejercicio!: Ejercicio;
  @Input() indice = 1;
  @Input() permitirRegistro = true;
  @Input() routineMuscles: string[] = [];

  get muscles(): string[] {
    return this.esMaquina
      ? (this.ejercicio?.maquina?.grupos_musculares ?? this.routineMuscles)
      : this.routineMuscles;
  }

  @Output() verDetalle = new EventEmitter<Ejercicio>();
  @Output() registrarSerie = new EventEmitter<Ejercicio>();

  get esMaquina(): boolean {
    return this.ejercicio?.tipo === 'maquina';
  }

  get esLibre(): boolean {
    return this.ejercicio?.tipo === 'libre';
  }

  get nombreVisible(): string {
    return this.esMaquina
      ? (this.ejercicio.maquina?.nombre ?? 'Máquina no disponible')
      : (this.ejercicio.nombre ?? 'Ejercicio');
  }

  get resumenSeries(): string {
    const s = this.ejercicio.series;
    const r = this.ejercicio.repeticiones;
    return `${s} × ${r}`;
  }

  onTap(): void {
    this.verDetalle.emit(this.ejercicio);
  }

  onRegister(event: Event): void {
    event.stopPropagation();
    this.registrarSerie.emit(this.ejercicio);
  }
}