import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { User } from '../../../../../shared/models/user.model';
import { EditarDatosAlumnoPayload } from '../../../models/rutina-builder.model';
import { ProfesorService } from '../../../services/profesor.service';

@Component({
  selector: 'app-tab-perfil',
  templateUrl: './tab-perfil.component.html',
  styleUrls: ['./tab-perfil.component.scss'],
})
export class TabPerfilComponent implements OnChanges {

  @Input() alumno!: User;
  @Output() actualizado = new EventEmitter<User>();

  // Sheet de edición
  sheetVisible = false;
  form: FormGroup;
  guardando = false;
  errorEdicion: string | null = null;
  exitoEdicion: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profesorService: ProfesorService,
  ) {
    this.form = this.fb.group({
      peso_actual: [null as number | null, [Validators.min(20), Validators.max(300)]],
      peso_objetivo: [null as number | null, [Validators.min(20), Validators.max(300)]],
      porcentaje_grasa: [null as number | null, [Validators.min(3), Validators.max(70)]],
      notas_profesor: ['', [Validators.maxLength(1000)]],
    });
  }

  ngOnChanges(_: SimpleChanges): void {
    // Nada por ahora. Podríamos refrescar el form si el alumno cambia.
  }

  get pesoCtrl() { return this.form.get('peso_actual')!; }
  get pesoObjetivoCtrl() { return this.form.get('peso_objetivo')!; }
  get grasaCtrl() { return this.form.get('porcentaje_grasa')!; }
  get notasCtrl() { return this.form.get('notas_profesor')!; }

  // -------- Getters de presentación --------

  get imcTexto(): string {
    return this.alumno?.imc != null ? this.alumno.imc.toFixed(1) : '—';
  }

  get tieneImc(): boolean {
    return this.alumno?.imc != null;
  }

  get grasaTexto(): string {
    return this.alumno?.porcentaje_grasa != null
      ? `${this.alumno.porcentaje_grasa}%`
      : '—';
  }

  get tieneGrasa(): boolean {
    return this.alumno?.porcentaje_grasa != null;
  }

  get grasaDetalle(): string {
    if (!this.alumno?.porcentaje_grasa) return 'Pendiente de medición';
    const origen = this.alumno.origen_grasa === 'profesor'
      ? 'Medido por profesor'
      : 'Auto-reportado';
    const fecha = this.alumno.fecha_medicion_grasa
      ? ` · ${this.formatearFechaCorta(this.alumno.fecha_medicion_grasa)}`
      : '';
    return `${origen}${fecha}`;
  }

  get faltanKg(): number | null {
    if (!this.alumno?.peso_actual || !this.alumno?.peso_objetivo) return null;
    return Math.round((this.alumno.peso_actual - this.alumno.peso_objetivo) * 10) / 10;
  }

  get tieneObjetivo(): boolean {
    return this.alumno?.peso_objetivo != null;
  }

  get textoObjetivo(): string {
    if (!this.tieneObjetivo) return '';
    const dif = this.faltanKg;
    if (dif == null) return `Objetivo: ${this.alumno.peso_objetivo} kg`;
    if (dif > 0) return `Faltan ${dif} kg para el objetivo de ${this.alumno.peso_objetivo} kg`;
    if (dif < 0) return `Superó el objetivo por ${Math.abs(dif)} kg`;
    return 'Está en su peso objetivo';
  }

  get tieneNotas(): boolean {
    return !!this.alumno?.notas_profesor;
  }

  // -------- Sheet --------

  abrirEdicion(): void {
    if (!this.alumno) return;

    this.form.patchValue({
      peso_actual: this.alumno.peso_actual,
      peso_objetivo: this.alumno.peso_objetivo,
      porcentaje_grasa: this.alumno.porcentaje_grasa,
      notas_profesor: this.alumno.notas_profesor ?? '',
    });
    this.errorEdicion = null;
    this.sheetVisible = true;
  }

  cerrarEdicion(): void {
    this.sheetVisible = false;
    setTimeout(() => {
      this.errorEdicion = null;
      this.form.reset();
    }, 250);
  }

  guardarEdicion(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorEdicion = null;

    const raw = this.form.value;
    const payload: EditarDatosAlumnoPayload = {
      peso_actual: raw.peso_actual != null ? Number(raw.peso_actual) : null,
      peso_objetivo: raw.peso_objetivo != null ? Number(raw.peso_objetivo) : null,
      porcentaje_grasa: raw.porcentaje_grasa != null ? Number(raw.porcentaje_grasa) : null,
      notas_profesor: raw.notas_profesor?.trim() || null,
    };

    this.profesorService
      .editarDatosAlumno(this.alumno.id, payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (user: User) => {
          this.actualizado.emit(user);
          this.exitoEdicion = 'Datos actualizados';
          setTimeout(() => (this.exitoEdicion = null), 2000);
          this.cerrarEdicion();
        },
        error: (err: any) => {
          this.errorEdicion =
            err?.error?.error?.message ?? 'No se pudieron guardar los cambios.';
        },
      });
  }

  // -------- Helpers --------

  private formatearFechaCorta(iso: string): string {
    const d = new Date(iso);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]}`;
  }
}