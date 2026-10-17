import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UnidadPeso } from '../../../../shared/utils/peso';
import { EjercicioBuilder, pesoBuilderValido } from '../../models/rutina-builder.model';
import { Maquina } from '../../../maquinas/models/maquina.model';

@Component({
  selector: 'app-ejercicio-builder-card',
  templateUrl: './ejercicio-builder-card.component.html',
  styleUrls: ['./ejercicio-builder-card.component.scss'],
})
export class EjercicioBuilderCardComponent {

  @Input() ejercicio!: EjercicioBuilder;
  @Input() indice = 1;
  @Input() total = 1;

  @Output() cambio = new EventEmitter<EjercicioBuilder>();
  @Output() eliminar = new EventEmitter<void>();
  @Output() subir = new EventEmitter<void>();
  @Output() bajar = new EventEmitter<void>();
  @Output() toggleMin = new EventEmitter<void>();

  get maquinaSeleccionada(): Maquina | null {
    if (!this.ejercicio.maquina_id) return null;
    return {
      id: this.ejercicio.maquina_id,
      nombre: this.ejercicio.maquina_nombre ?? this.ejercicio.maquina_id,
      grupos_musculares: [],
      descripcion: '',
      video_url: '',
      imagen_url: '',
    };
  }

  get nombreVisible(): string {
    if (this.ejercicio.tipo === 'maquina') {
      return this.ejercicio.maquina_nombre || 'Máquina sin seleccionar';
    }
    return this.ejercicio.nombre?.trim() || 'Ejercicio sin nombre';
  }

  get resumenSeries(): string {
    return `${this.ejercicio.series} × ${this.ejercicio.repeticiones}${
      this.ejercicio.peso_sugerido ? ' · ' + this.ejercicio.peso_sugerido : ''
    }`;
  }

  cambiarTipo(tipo: 'maquina' | 'libre'): void {
    if (this.ejercicio.tipo === tipo) return;
    const copia = { ...this.ejercicio, tipo };
    if (tipo === 'maquina') {
      copia.nombre = null;
      copia.descripcion = null;
    } else {
      copia.maquina_id = null;
      copia.maquina_nombre = null;
    }
    this.cambio.emit(copia);
  }

  onMaquinaChange(m: Maquina | null): void {
    const copia = { ...this.ejercicio };
    if (m) {
      copia.maquina_id = m.id;
      copia.maquina_nombre = m.nombre;
    } else {
      copia.maquina_id = null;
      copia.maquina_nombre = null;
    }
    this.cambio.emit(copia);
  }

  onNombreChange(v: string): void {
    this.cambio.emit({ ...this.ejercicio, nombre: v });
  }

  onDescripcionChange(v: string): void {
    this.cambio.emit({ ...this.ejercicio, descripcion: v });
  }

  onSeriesChange(v: number): void {
    this.cambio.emit({ ...this.ejercicio, series: v });
  }

  onRepsChange(v: string): void {
    this.cambio.emit({ ...this.ejercicio, repeticiones: v });
  }

  get pesoValido(): boolean {
    return pesoBuilderValido(this.ejercicio);
  }

  onUnidadPesoChange(unidad: UnidadPeso): void {
    this.emitirPeso({ ...this.ejercicio, peso_unidad: unidad });
  }

  onPesoValorChange(valor: number | null): void {
    this.emitirPeso({ ...this.ejercicio, peso_valor: valor });
  }

  onPesoOtroChange(texto: string): void {
    this.emitirPeso({ ...this.ejercicio, peso_otro: texto });
  }

  private emitirPeso(ejercicio: EjercicioBuilder): void {
    ejercicio.peso_sugerido = ejercicio.peso_unidad === 'otro'
      ? ejercicio.peso_otro.trim()
      : (ejercicio.peso_valor === null ? '' : `${ejercicio.peso_valor} ${ejercicio.peso_unidad}`);
    this.cambio.emit(ejercicio);
  }

  onEliminar(): void { this.eliminar.emit(); }
  onSubir(): void { this.subir.emit(); }
  onBajar(): void { this.bajar.emit(); }
  onToggleMin(): void { this.toggleMin.emit(); }

  ajustarSeries(delta: number): void {
    const nuevo = this.ejercicio.series + delta;
    if (nuevo >= 1 && nuevo <= 20) this.onSeriesChange(nuevo);
  }

  get esPrimero(): boolean { return this.indice === 1; }
  get esUltimo(): boolean { return this.indice === this.total; }
}