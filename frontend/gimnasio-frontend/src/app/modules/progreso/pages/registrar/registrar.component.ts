import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CrearSeriePayload, SerieConfirmada, TipoEjercicio } from '../../models/progreso.model';
import { metricasFormulario, metricasPayload, metricasValidas, resumenRegistro } from '../../models/metricas-registro';
import { ProgresoService } from '../../services/progreso.service';
import { CatalogoService } from '../../../ejercicios/services/catalogo.service';
import { EjercicioCatalogo } from '../../../ejercicios/models/catalogo.model';

@Component({ selector: 'app-progreso-registrar', templateUrl: './registrar.component.html', styleUrls: ['./registrar.component.scss'] })
export class RegistrarComponent implements OnInit, OnDestroy {
  tipo: TipoEjercicio = 'libre';
  maquinaId: string | null = null;
  nombreLibre: string | null = null;
  nombreVisible = '';
  rutinaId: string | null = null;
  catalogoId: string | null = null;
  ejercicio: EjercicioCatalogo | null = null;
  recursosSeleccionados: string[] = [];
  rutaRetorno = '/progreso';
  seriesObjetivo: number | null = null;
  pesoSugerido = '';
  metricas = metricasFormulario({ peso: '40 kg', repeticiones: '10' });
  metricasEdicion = metricasFormulario();
  readonly metricasValidas = metricasValidas;
  readonly resumenRegistro = resumenRegistro;
  series: SerieConfirmada[] = [];
  cargando = false;
  guardando = false;
  errorMensaje: string | null = null;
  exitoMensaje: string | null = null;
  edicionVisible = false;
  serieEnEdicion: SerieConfirmada | null = null;
  guardandoEdicion = false;
  errorEdicion: string | null = null;
  private carga?: Subscription;
  private escritura?: Subscription;
  private edicion?: Subscription;

  constructor(private route: ActivatedRoute, private router: Router,
    private progresoService: ProgresoService, private catalogoService: CatalogoService) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.catalogoId = qp.get('ejercicio_catalogo_id');
    this.rutinaId = qp.get('rutina_id');
    const volver = qp.get('volver_a');
    if (volver?.startsWith('/') && !volver.startsWith('//')) this.rutaRetorno = volver;
    const objetivo = Number(qp.get('series'));
    if (Number.isInteger(objetivo) && objetivo > 0) this.seriesObjetivo = objetivo;
    this.pesoSugerido = qp.get('peso') ?? '';
    this.metricas = metricasFormulario({ peso: this.pesoSugerido || '40 kg', repeticiones: qp.get('repeticiones') || '10' });
    if (this.catalogoId) { this.cargarEjercicio(); return; }
    const tipo = qp.get('tipo');
    const nombre = qp.get('nombre');
    if (tipo === 'maquina' && qp.get('maquina_id')) {
      this.tipo = 'maquina'; this.maquinaId = qp.get('maquina_id'); this.nombreVisible = nombre || this.maquinaId!;
    } else if (tipo === 'libre' && nombre) {
      this.tipo = 'libre'; this.nombreLibre = nombre; this.nombreVisible = nombre;
    } else this.router.navigate(['/progreso/seleccionar-ejercicio']);
  }
  ngOnDestroy(): void { this.carga?.unsubscribe(); this.escritura?.unsubscribe(); this.edicion?.unsubscribe(); }
  get esCardio(): boolean { return this.metricas.modalidad === 'cardio'; }
  get indicadorSerie(): string {
    const nombre = this.esCardio ? 'Registro' : 'Serie';
    return `${nombre} ${this.series.length + 1}${this.seriesObjetivo ? ' de ' + this.seriesObjetivo : ''}`;
  }
  get puedeRegistrar(): boolean {
    return !this.cargando && !this.guardando && metricasValidas(this.metricas)
      && (!this.catalogoId || (!!this.ejercicio && this.recursosSeleccionados.length > 0));
  }
  cargarEjercicio(): void {
    if (!this.catalogoId) return;
    this.carga?.unsubscribe(); this.cargando = true; this.errorMensaje = null; this.ejercicio = null;
    this.carga = this.catalogoService.obtener(this.catalogoId).pipe(finalize(() => (this.cargando = false))).subscribe({
      next: e => {
        this.ejercicio = e; this.nombreVisible = e.nombre;
        this.metricas = { ...this.metricas, modalidad: e.categoria === 'cardio' ? 'cardio' : 'fuerza' };
        if (e.categoria === 'cardio') {
          this.seriesObjetivo = null;
          const qp = this.route.snapshot.queryParamMap;
          const minutos = Number(qp.get('duracion_minutos'));
          const km = Number(qp.get('distancia_km'));
          if (Number.isFinite(minutos) && minutos > 0 && minutos <= 10080) this.metricas.duracion_segundos = Math.round(minutos * 60);
          if (Number.isFinite(km) && km > 0 && km <= 1000) this.metricas.distancia_metros = Math.round(km * 100000) / 100;
        }
        this.recursosSeleccionados = e.recursos.length === 1 ? [e.recursos[0].id] : [];
      },
      error: err => { this.errorMensaje = err?.error?.error?.message ?? 'No se pudo cargar el ejercicio.'; },
    });
  }
  toggleRecurso(id: string): void {
    this.recursosSeleccionados = this.recursosSeleccionados.includes(id)
      ? this.recursosSeleccionados.filter(r => r !== id) : [...this.recursosSeleccionados, id];
  }
  registrarSerie(): void {
    if (!this.puedeRegistrar) return;
    this.guardando = true; this.errorMensaje = null;
    const payload: CrearSeriePayload = { ...metricasPayload(this.metricas), rutina_id: this.rutinaId,
      ...(this.catalogoId ? { ejercicio_catalogo_id: this.catalogoId, recurso_ids: this.recursosSeleccionados }
        : { ejercicio_tipo: this.tipo, maquina_id: this.maquinaId, nombre_libre: this.nombreLibre }) };
    this.escritura = this.progresoService.registrarSerie(payload).pipe(finalize(() => (this.guardando = false))).subscribe({
      next: creado => {
        this.series = [...this.series, creado];
        this.exitoMensaje = `${this.esCardio ? 'Registro' : 'Serie'} ${creado.numero_serie} registrado`;
      },
      error: err => { this.errorMensaje = err?.error?.error?.message ?? 'No se pudo guardar el entrenamiento.'; },
    });
  }
  abrirEdicion(serie: SerieConfirmada): void {
    this.serieEnEdicion = serie; this.metricasEdicion = metricasFormulario(serie);
    this.errorEdicion = null; this.edicionVisible = true;
  }
  cerrarEdicion(): void { this.edicionVisible = false; this.serieEnEdicion = null; this.errorEdicion = null; }
  guardarEdicion(): void {
    if (!this.serieEnEdicion || this.guardandoEdicion || !metricasValidas(this.metricasEdicion)) return;
    this.guardandoEdicion = true; this.errorEdicion = null;
    this.edicion = this.progresoService.actualizarSerie(this.serieEnEdicion.id, metricasPayload(this.metricasEdicion))
      .pipe(finalize(() => (this.guardandoEdicion = false))).subscribe({
        next: actualizado => { this.series = this.series.map(s => s.id === actualizado.id ? actualizado : s); this.cerrarEdicion(); },
        error: err => { this.errorEdicion = err?.error?.error?.message ?? 'No se pudo actualizar el registro.'; },
      });
  }
  terminar(): void { this.router.navigateByUrl(this.rutaRetorno); }
  cancelar(): void { this.terminar(); }
  trackBySerie(_: number, serie: SerieConfirmada): string { return serie.id; }
}
