import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StepperComponent } from '../stepper/stepper.component';
import { MetricasFormulario } from '../../models/metricas-registro';

@Component({
  selector: 'app-metricas-registro', standalone: true,
  imports: [CommonModule, FormsModule, StepperComponent],
  templateUrl: './metricas-registro.component.html',
  styles: [`:host{display:block} .metricas{display:grid;gap:12px} label{display:grid;gap:6px;font-size:14px} input,select{width:100%;min-width:0;min-height:44px;padding:10px 12px;border:1px solid var(--color-border,#ddd);border-radius:10px;background:#fff;color:#222;font:inherit} .metricas__peso{display:grid;grid-template-columns:90px minmax(0,1fr);gap:8px} .metricas__nota{margin:0;color:#666;font-size:13px}`],
})
export class MetricasRegistroComponent {
  @Input({ required: true }) valor!: MetricasFormulario;
  @Input() conSteppers = false;
  @Output() valorChange = new EventEmitter<MetricasFormulario>();
  cambiar(campo: keyof MetricasFormulario, value: string | number | null): void {
    this.valorChange.emit({ ...this.valor, [campo]: value });
  }
  minutos(value: number | null): void { this.cambiar('duracion_segundos', value === null ? null : Math.round(value * 60)); }
  kilometros(value: number | null): void { this.cambiar('distancia_metros', value === null ? null : Math.round(value * 100000) / 100); }
}
