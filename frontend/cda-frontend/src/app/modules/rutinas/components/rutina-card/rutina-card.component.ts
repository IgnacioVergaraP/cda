import { Component, Input } from '@angular/core';
import { Rutina } from '../../models/rutina.model';
import { etiquetaMusculo } from '../../../maquinas/models/maquina.model';

@Component({
  selector: 'app-rutina-card',
  templateUrl: './rutina-card.component.html',
  styleUrls: ['./rutina-card.component.scss'],
})
export class RutinaCardComponent {

  @Input() rutina!: Rutina;

  get cantidadEjercicios(): number {
    return this.rutina?.ejercicios?.length ?? 0;
  }

  get estaArchivada(): boolean {
    return this.rutina?.activa === false;
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }
}