import { Component, Input } from '@angular/core';
import { Maquina, etiquetaMusculo } from '../../models/maquina.model';

@Component({
  selector: 'app-maquina-card',
  templateUrl: './maquina-card.component.html',
  styleUrls: ['./maquina-card.component.scss'],
})
export class MaquinaCardComponent {

  @Input() maquina!: Maquina;

  get tieneImagen(): boolean {
    return !!this.maquina?.imagen_url;
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }
}