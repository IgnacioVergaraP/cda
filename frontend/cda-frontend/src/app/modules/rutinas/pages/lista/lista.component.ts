import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth.service';
import { Rutina } from '../../models/rutina.model';
import { RutinasService } from '../../services/rutinas.service';
import { SolicitudesRutinaService } from '../../services/solicitudes-rutina.service';
import {
  CrearSolicitudRutinaPayload,
  OBJETIVOS_RUTINA,
  ObjetivoRutina,
  ProfesorDisponible,
  SolicitudRutina,
} from '../../../profesor/models/solicitud-rutina.model';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';

@Component({
  selector: 'app-rutinas-lista',
  templateUrl: './lista.component.html',
  styleUrls: ['./lista.component.scss'],
})
export class ListaComponent implements OnInit {

  rutinas: Rutina[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  // Toggle archivadas
  mostrarArchivadas = false;

  // Solicitudes de rutina
  solicitudes: SolicitudRutina[] = [];

  // Sheet de creación
  sheetVisible = false;
  form: FormGroup;
  objetivoSeleccionado: ObjetivoRutina = 'hipertrofia';
  diasPorSemana = 4;
  gruposSeleccionados: string[] = [];
  profesorSeleccionadoId: string | null = null;

  // Profesores disponibles
  profesores: ProfesorDisponible[] = [];
  cargandoProfesores = false;

  guardandoSolicitud = false;
  errorSolicitud: string | null = null;
  exitoSolicitud: string | null = null;

  readonly objetivos = OBJETIVOS_RUTINA;
  readonly gruposDisponibles = GRUPOS_MUSCULARES;

  constructor(
    public auth: AuthService,
    private rutinasService: RutinasService,
    private solicitudesService: SolicitudesRutinaService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      comentarios: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarSolicitudes();
    this.cargarProfesores();
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  // -------- Rutinas --------

  reintentar(): void {
    this.cargar();
  }

  toggleArchivadas(): void {
    this.mostrarArchivadas = !this.mostrarArchivadas;
    this.cargar();
  }

  trackById(_: number, r: Rutina): string {
    return r.id;
  }

  // -------- Solicitud --------

  abrirSheetSolicitud(): void {
    this.form.reset({ comentarios: '' });
    this.objetivoSeleccionado = 'hipertrofia';
    this.diasPorSemana = 4;
    this.gruposSeleccionados = [];
    this.profesorSeleccionadoId = null;
    this.errorSolicitud = null;
    this.sheetVisible = true;
  }

  cerrarSheetSolicitud(): void {
    this.sheetVisible = false;
    setTimeout(() => (this.errorSolicitud = null), 250);
  }

  seleccionarObjetivo(o: ObjetivoRutina): void {
    this.objetivoSeleccionado = o;
  }

  ajustarDias(delta: number): void {
    const nuevo = this.diasPorSemana + delta;
    if (nuevo >= 1 && nuevo <= 7) this.diasPorSemana = nuevo;
  }

  toggleGrupo(g: string): void {
    const idx = this.gruposSeleccionados.indexOf(g);
    if (idx >= 0) {
      this.gruposSeleccionados = this.gruposSeleccionados.filter(x => x !== g);
    } else {
      if (this.gruposSeleccionados.length >= 6) return;
      this.gruposSeleccionados = [...this.gruposSeleccionados, g];
    }
  }

  estaSeleccionado(g: string): boolean {
    return this.gruposSeleccionados.includes(g);
  }

  onProfesorChange(valor: string): void {
    this.profesorSeleccionadoId = valor === '' ? null : valor;
  }

  get profesoresOrdenados(): ProfesorDisponible[] {
    return [...this.profesores].sort((a, b) => {
      const aEsp = a.especialidades?.length ?? 0;
      const bEsp = b.especialidades?.length ?? 0;
      if (aEsp !== bEsp) return bEsp - aEsp;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  enviarSolicitud(): void {
    if (this.guardandoSolicitud) return;

    this.guardandoSolicitud = true;
    this.errorSolicitud = null;

    const payload: CrearSolicitudRutinaPayload = {
      objetivo: this.objetivoSeleccionado,
      dias_por_semana: this.diasPorSemana,
      comentarios: this.form.value.comentarios?.trim() || null,
      grupos_interes: this.gruposSeleccionados.length > 0 ? this.gruposSeleccionados : null,
      profesor_preferido_id: this.profesorSeleccionadoId,
    };

    this.solicitudesService
      .crear(payload)
      .pipe(finalize(() => (this.guardandoSolicitud = false)))
      .subscribe({
        next: (creada: SolicitudRutina) => {
          this.solicitudes = [creada, ...this.solicitudes];
          this.exitoSolicitud = 'Solicitud enviada';
          setTimeout(() => (this.exitoSolicitud = null), 2500);
          this.cerrarSheetSolicitud();
        },
        error: (err: any) => {
          this.errorSolicitud =
            err?.error?.error?.message ?? 'No se pudo enviar la solicitud.';
        },
      });
  }

  cancelarSolicitud(s: SolicitudRutina): void {
    this.solicitudesService.cancelar(s.id).subscribe({
      next: (actualizada: SolicitudRutina) => {
        this.solicitudes = this.solicitudes.map(x =>
          x.id === actualizada.id ? actualizada : x,
        );
      },
      error: () => {},
    });
  }

  // -------- Cargas --------

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.rutinasService
      .listar(this.mostrarArchivadas)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Rutina[]) => (this.rutinas = data),
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar las rutinas.';
          this.rutinas = [];
        },
      });
  }

  private cargarSolicitudes(): void {
    this.solicitudesService.listarMias().subscribe({
      next: (data: SolicitudRutina[]) => (this.solicitudes = data),
      error: () => (this.solicitudes = []),
    });
  }

  private cargarProfesores(): void {
    this.cargandoProfesores = true;
    this.solicitudesService
      .listarProfesores()
      .pipe(finalize(() => (this.cargandoProfesores = false)))
      .subscribe({
        next: (data: ProfesorDisponible[]) => (this.profesores = data),
        error: () => (this.profesores = []),
      });
  }
}