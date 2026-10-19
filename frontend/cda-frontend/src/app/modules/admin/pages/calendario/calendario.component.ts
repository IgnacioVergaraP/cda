import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import {
  CrearHorarioPayload,
  DIAS_SEMANA,
  EditarHorarioPayload,
  Horario,
  ProfesorAdmin,
} from '../../models/horario.model';

@Component({
  selector: 'app-admin-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
})
export class CalendarioComponent implements OnInit {

  horarios: Horario[] = [];
  profesores: ProfesorAdmin[] = [];

  filtroProfesorId: string | null = null;

  cargando = false;
  errorMensaje: string | null = null;

  readonly dias = DIAS_SEMANA;

  // Sheet crear/editar
  sheetVisible = false;
  modoEdicion = false;
  horarioEditando: Horario | null = null;
  form: FormGroup;
  guardando = false;
  errorSheet: string | null = null;

  // Modal eliminar
  modalEliminarVisible = false;
  horarioAEliminar: Horario | null = null;
  eliminando = false;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      profesor_id: ['', [Validators.required]],
      dia_semana: [0, [Validators.required]],
      hora_inicio: ['08:00', [Validators.required]],
      hora_fin: ['12:00', [Validators.required]],
      notas: [''],
    });
  }

  ngOnInit(): void {
    this.cargarProfesores();
    this.cargarHorarios();
  }

  get puedeGuardar(): boolean {
    if (this.guardando || this.form.invalid) return false;
    const hi = this.form.value.hora_inicio;
    const hf = this.form.value.hora_fin;
    if (!hi || !hf) return false;
    return hi < hf;
  }

  reintentar(): void { this.cargar(); }

  trackById(_: number, h: Horario): string { return h.id; }

  onFiltroProfesorChange(): void {
    this.cargarHorarios();
  }

  // -------- Sheet crear --------

  abrirCrear(): void {
    this.modoEdicion = false;
    this.horarioEditando = null;
    this.form.reset({
      profesor_id: this.profesores[0]?.id ?? '',
      dia_semana: 0,
      hora_inicio: '08:00',
      hora_fin: '12:00',
      notas: '',
    });
    this.errorSheet = null;
    this.sheetVisible = true;
  }

  // -------- Sheet editar --------

  abrirEditar(h: Horario): void {
    this.modoEdicion = true;
    this.horarioEditando = h;
    this.form.patchValue({
      profesor_id: h.profesor_id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      notas: h.notas ?? '',
    });
    // El profesor no se puede cambiar en edición
    this.form.get('profesor_id')?.disable();
    this.errorSheet = null;
    this.sheetVisible = true;
  }

  cerrarSheet(): void {
    this.sheetVisible = false;
    this.form.get('profesor_id')?.enable();
    setTimeout(() => {
      this.errorSheet = null;
      this.horarioEditando = null;
    }, 250);
  }

  guardar(): void {
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorSheet = null;

    const raw = this.form.getRawValue();

    if (this.modoEdicion && this.horarioEditando) {
      const payload: EditarHorarioPayload = {
        dia_semana: Number(raw.dia_semana),
        hora_inicio: raw.hora_inicio,
        hora_fin: raw.hora_fin,
        notas: raw.notas?.trim() || null,
      };
      this.adminService
        .editarHorario(this.horarioEditando.id, payload)
        .pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: () => {
            this.cerrarSheet();
            this.cargar();
          },
          error: (err: any) => {
            this.errorSheet = err?.error?.error?.message ?? 'No se pudo editar.';
          },
        });
      return;
    }

    const payload: CrearHorarioPayload = {
      profesor_id: raw.profesor_id,
      dia_semana: Number(raw.dia_semana),
      hora_inicio: raw.hora_inicio,
      hora_fin: raw.hora_fin,
      notas: raw.notas?.trim() || null,
    };

    this.adminService
      .crearHorario(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.cerrarSheet();
          this.cargar();
        },
        error: (err: any) => {
          this.errorSheet = err?.error?.error?.message ?? 'No se pudo crear.';
        },
      });
  }

  // -------- Eliminar --------

  confirmarEliminar(h: Horario): void {
    this.horarioAEliminar = h;
    this.modalEliminarVisible = true;
  }

  cerrarEliminar(): void {
    this.modalEliminarVisible = false;
    setTimeout(() => (this.horarioAEliminar = null), 200);
  }

  eliminar(): void {
    if (!this.horarioAEliminar || this.eliminando) return;
    this.eliminando = true;

    this.adminService
      .eliminarHorario(this.horarioAEliminar.id)
      .pipe(finalize(() => (this.eliminando = false)))
      .subscribe({
        next: () => {
          this.cerrarEliminar();
          this.cargar();
        },
        error: () => {},
      });
  }

  // -------- Clic en celda de la grilla --------

  onCeldaClick(event: { dia: number; franja: any; horarios: Horario[] }): void {
    if (event.horarios.length === 0) {
      // Crear nuevo con día y hora prellenados
      this.abrirCrear();
      this.form.patchValue({
        dia_semana: event.dia,
        hora_inicio: this.padHora(event.franja.inicio),
        hora_fin: this.padHora(event.franja.fin),
      });
      return;
    }
    if (event.horarios.length === 1) {
      this.abrirEditar(event.horarios[0]);
      return;
    }
    // Más de uno: no hay UI específica, abrimos el primero
    this.abrirEditar(event.horarios[0]);
  }

  onHorarioListaClick(h: Horario): void {
    this.abrirEditar(h);
  }

  // -------- Cargas --------

  reintentarCarga(): void { this.cargar(); }

  private cargar(): void {
    this.cargarHorarios();
  }

  private cargarHorarios(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.adminService
      .listarHorarios(this.filtroProfesorId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => (this.horarios = data),
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar los horarios.';
          this.horarios = [];
        },
      });
  }

  private cargarProfesores(): void {
    this.adminService.listarProfesores().subscribe({
      next: (data) => (this.profesores = data),
      error: () => (this.profesores = []),
    });
  }

  private padHora(h: number): string {
    return `${h.toString().padStart(2, '0')}:00`;
  }
}