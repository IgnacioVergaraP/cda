import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PuntoEvolucion } from '../../../modules/progreso/models/progreso.model';

interface PuntoGrafico {
  x: number;
  y: number;
  peso: number;
  fecha: string;
  etiqueta: string;
}

@Component({
  selector: 'app-grafico-evolucion',
  templateUrl: './grafico-evolucion.component.html',
  styleUrls: ['./grafico-evolucion.component.scss'],
})
export class GraficoEvolucionComponent implements OnChanges {

  @Input() puntos: PuntoEvolucion[] = [];
  @Input() prHistorico: number | null = null;

  readonly ancho = 320;
  readonly alto = 160;
  readonly paddingX = 16;
  readonly paddingY = 20;

  puntosGrafico: PuntoGrafico[] = [];
  pathLinea = '';
  pathArea = '';
  pesoMin = 0;
  pesoMax = 0;

  ngOnChanges(_: SimpleChanges): void {
    this.calcular();
  }

  get tieneDatos(): boolean {
    return this.puntosGrafico.length > 0;
  }

  private calcular(): void {
    const puntos = this.puntos ?? [];

    if (puntos.length === 0) {
      this.puntosGrafico = [];
      this.pathLinea = '';
      this.pathArea = '';
      return;
    }

    const pesos = puntos.map(p => p.peso_max);
    const min = Math.min(...pesos);
    const max = Math.max(...pesos);
    const rango = max - min || 1;

    this.pesoMin = min;
    this.pesoMax = max;

    const anchoUtil = this.ancho - this.paddingX * 2;
    const altoUtil = this.alto - this.paddingY * 2;

    const n = puntos.length;
    const pasoX = n > 1 ? anchoUtil / (n - 1) : 0;

    this.puntosGrafico = puntos.map((p, i) => {
      const x = this.paddingX + i * pasoX;
      const y = this.paddingY + altoUtil - ((p.peso_max - min) / rango) * altoUtil;
      return {
        x,
        y,
        peso: p.peso_max,
        fecha: p.fecha,
        etiqueta: this.formatearFecha(p.fecha),
      };
    });

    this.pathLinea = this.puntosGrafico
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');

    const baseY = this.alto - this.paddingY;
    this.pathArea = `${this.pathLinea} L ${this.puntosGrafico[this.puntosGrafico.length - 1].x.toFixed(2)} ${baseY} L ${this.puntosGrafico[0].x.toFixed(2)} ${baseY} Z`;
  }

  formatearFecha(fecha: string): string {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }
}