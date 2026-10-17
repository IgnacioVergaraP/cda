import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ejercicio, resumenCardio } from '../../models/rutina.model';

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
    if (this.ejercicio?.catalogo) return this.ejercicio.catalogo.grupos_musculares;
    return this.esMaquina
      ? (this.ejercicio?.maquina?.grupos_musculares ?? this.routineMuscles)
      : this.routineMuscles;
  }

  @Output() verDetalle = new EventEmitter<Ejercicio>();
  @Output() registrarSerie = new EventEmitter<Ejercicio>();

  get esMaquina(): boolean {
    if (this.ejercicio?.catalogo) return this.ejercicio.catalogo.categoria === 'maquina';
    return this.ejercicio?.tipo === 'maquina';
  }

  get esLibre(): boolean {
    if (this.ejercicio?.catalogo) return this.ejercicio.catalogo.categoria === 'libre';
    return this.ejercicio?.tipo === 'libre';
  }

  get nombreVisible(): string {
    if (this.ejercicio.catalogo) return this.ejercicio.catalogo.nombre;
    return this.ejercicio.tipo === 'maquina'
      ? (this.ejercicio.maquina?.nombre ?? 'Máquina no disponible')
      : (this.ejercicio.nombre ?? 'Ejercicio');
  }

  get resumenSeries(): string {
    if (this.ejercicio.catalogo?.categoria === 'cardio') return resumenCardio(this.ejercicio);
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
