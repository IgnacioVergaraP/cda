import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  CrearReportePayload,
  EstadoReporte,
  PRIORIDADES_REPORTE,
  PrioridadReporte,
  Reporte,
  TIPOS_REPORTE,
  TipoReporte,
} from '../../models/reporte.model';
import { ProfesorService } from '../../services/profesor.service';
import { Maquina, GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { MaquinasService } from '../../../maquinas/services/maquinas.service';

type FiltroEstado = 'todos' | EstadoReporte;

@Component({
  selector: 'app-profesor-reportar',
  templateUrl: './reportar.component.html',
  styleUrls: ['./reportar.component.scss'],
})
export class ReportarComponent implements OnInit {

  reportes: Reporte[] = [];
  filtrados: Reporte[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  filtroEstado: FiltroEstado = 'todos';

  // Sheet de creación
  sheetVisible = false;
  form: FormGroup;
  tipoSeleccionado: TipoReporte = 'rota';
  prioridadSeleccionada: PrioridadReporte = 'media';
  fotoAdjunta = false;

  // Selector de máquina (dentro del sheet)
  maquinas: Maquina[] = [];
  maquinasFiltradas: Maquina[] = [];
  busquedaMaquina = '';
  filtroMusculo: string | null = null;
  maquinaSeleccionada: Maquina | null = null;
  cargandoMaquinas = false;

  guardando = false;
  errorCreacion: string | null = null;
  exitoCreacion: string | null = null;

  readonly tipos = TIPOS_REPORTE;
  readonly prioridades = PRIORIDADES_REPORTE;
  readonly grupos = GRUPOS_MUSCULARES;

  readonly filtros: { value: FiltroEstado; label: string }[] = [
    { value: 'todos',       label: 'Todos' },
    { value: 'abierto',     label: 'Abiertos' },
    { value: 'en_revision', label: 'En revisión' },
    { value: 'resuelto',    label: 'Resueltos' },
    { value: 'cancelado',   label: 'Cancelados' },
  ];

  constructor(
    private profesorService: ProfesorService,
    private maquinasService: MaquinasService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get descripcionCtrl() { return this.form.get('descripcion')!; }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  // -------- Filtros --------

  onFiltroChange(f: FiltroEstado): void {
    this.filtroEstado = f;
    this.aplicarFiltro();
  }

  // -------- Sheet --------

  abrirSheet(): void {
    this.form.reset({ descripcion: '' });
    this.tipoSeleccionado = 'rota';
    this.prioridadSeleccionada = 'media';
    this.fotoAdjunta = false;
    this.maquinaSeleccionada = null;
    this.busquedaMaquina = '';
    this.filtroMusculo = null;
    this.errorCreacion = null;
    this.sheetVisible = true;

    if (this.maquinas.length === 0) {
      this.cargarMaquinas();
    }
  }

  cerrarSheet(): void {
    this.sheetVisible = false;
    setTimeout(() => {
      this.errorCreacion = null;
    }, 250);
  }

  seleccionarTipo(t: TipoReporte): void { this.tipoSeleccionado = t; }
  seleccionarPrioridad(p: PrioridadReporte): void { this.prioridadSeleccionada = p; }

  simularFoto(): void {
    // El upload real va a llegar con Supabase Storage.
    // Por ahora solo marcamos visualmente que se adjuntó.
    this.fotoAdjunta = true;
  }

  quitarFoto(): void {
    this.fotoAdjunta = false;
  }

  // -------- Selector de máquina --------

  elegirMaquina(m: Maquina): void {
    this.maquinaSeleccionada = m;
  }

  quitarMaquina(): void {
    this.maquinaSeleccionada = null;
  }

  onBusquedaMaquinaChange(): void {
    this.aplicarFiltrosMaquinas();
  }

  onFiltroMusculoChange(m: string | null): void {
    this.filtroMusculo = m;
    this.aplicarFiltrosMaquinas();
  }

  get puedeGuardar(): boolean {
    return !this.guardando && this.form.valid;
  }

  guardar(): void {
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorCreacion = null;

    const payload: CrearReportePayload = {
      tipo: this.tipoSeleccionado,
      prioridad: this.prioridadSeleccionada,
      descripcion: this.form.value.descripcion.trim(),
      maquina_id: this.maquinaSeleccionada?.id ?? null,
      foto_url: this.fotoAdjunta ? 'placeholder://foto-adjunta' : null,
    };

    this.profesorService
      .crearReporte(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (creado: Reporte) => {
          this.reportes = [creado, ...this.reportes];
          this.aplicarFiltro();
          this.exitoCreacion = 'Reporte enviado';
          setTimeout(() => (this.exitoCreacion = null), 2500);
          this.cerrarSheet();
        },
        error: (err: any) => {
          this.errorCreacion =
            err?.error?.error?.message ?? 'No se pudo enviar el reporte.';
        },
      });
  }

  // -------- Cancelar --------

  cancelarReporte(r: Reporte): void {
    this.profesorService.cancelarReporte(r.id).subscribe({
      next: (actualizado: Reporte) => {
        this.reportes = this.reportes.map(x =>
          x.id === actualizado.id ? actualizado : x,
        );
        this.aplicarFiltro();
      },
      error: () => {},
    });
  }

  // -------- Carga --------

  reintentar(): void {
    this.cargar();
  }

  trackById(_: number, r: Reporte): string {
    return r.id;
  }

  private aplicarFiltro(): void {
    if (this.filtroEstado === 'todos') {
      this.filtrados = this.reportes;
      return;
    }
    this.filtrados = this.reportes.filter(r => r.estado === this.filtroEstado);
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarMisReportes()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Reporte[]) => {
          this.reportes = data;
          this.aplicarFiltro();
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar los reportes.';
          this.reportes = [];
          this.filtrados = [];
        },
      });
  }

  private cargarMaquinas(): void {
    this.cargandoMaquinas = true;
    this.maquinasService
      .listar()
      .pipe(finalize(() => (this.cargandoMaquinas = false)))
      .subscribe({
        next: (data: Maquina[]) => {
          this.maquinas = data;
          this.aplicarFiltrosMaquinas();
        },
        error: () => {
          this.maquinas = [];
          this.maquinasFiltradas = [];
        },
      });
  }

  private aplicarFiltrosMaquinas(): void {
    let res = this.maquinas;

    if (this.filtroMusculo) {
      res = res.filter(m =>
        m.grupos_musculares.some(g => g.toLowerCase() === this.filtroMusculo!.toLowerCase()),
      );
    }

    const q = this.busquedaMaquina.trim().toLowerCase();
    if (q) {
      res = res.filter(m => m.nombre.toLowerCase().includes(q));
    }

    this.maquinasFiltradas = res.slice(0, 10);
  }
}