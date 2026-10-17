import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent {

  @Input() label = '';
  @Input() sufijo = '';         // ej: 'kg', 'reps'
  @Input() valor: number = 0;
  @Input() paso = 1;
  @Input() min = 0;
  @Input() max = 999;

  @Output() valorChange = new EventEmitter<number>();
  @Output() valorEditado = new EventEmitter<number>();

  // Modo edición libre (input numérico)
  editando = false;
  valorInput: number = 0;

  get puedeRestar(): boolean {
    return this.valor > this.min;
  }

  get puedeSumar(): boolean {
    return this.valor < this.max;
  }

  sumar(): void {
    if (!this.puedeSumar) return;
    this.emitir(this.valor + this.paso);
  }

  restar(): void {
    if (!this.puedeRestar) return;
    this.emitir(this.valor - this.paso);
  }

  abrirEdicion(): void {
    this.valorInput = this.valor;
    this.editando = true;
  }

  confirmarEdicion(): void {
    const v = Number(this.valorInput);
    if (Number.isFinite(v) && v >= this.min && v <= this.max) {
      this.emitir(v);
      this.valorEditado.emit(v);
    }
    this.editando = false;
  }

  cancelarEdicion(): void {
    this.editando = false;
  }

  private emitir(v: number): void {
    // Redondeo a 1 decimal para evitar 42.499999999
    const redondeado = Math.min(this.max, Math.max(this.min, Math.round(v * 10) / 10));
    this.valor = redondeado;
    this.valorChange.emit(redondeado);
  }
}