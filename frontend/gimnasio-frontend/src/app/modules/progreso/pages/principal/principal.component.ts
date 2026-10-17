import { metricasFormulario, metricasPayload, metricasValidas, resumenRegistro } from '../../models/metricas-registro';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  Evolucion,
  HistorialFila,
  SesionDetalle,
  SerieEnSesion,
} from '../../models/progreso.model';
import { ProgresoService } from '../../services/progreso.service';

@Component({
  selector: 'app-progreso-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss'],
})
export class PrincipalComponent implements OnInit {

  historial: HistorialFila[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  evolucion: Evolucion | null = null;
  cargandoEvolucion = false;

  // Sheet de edición de sesión
  edicionVisible = false;
  sesion: SesionDetalle | null = null;
  cargandoSesion = false;
  errorSesion: string | null = null;

  // Serie en edición (dentro del sheet)
  serieEnEdicion: SerieEnSesion | null = null;
  metricasEdicion = metricasFormulario();
  readonly metricasValidas = metricasValidas;
  readonly resumenRegistro = resumenRegistro;
  guardandoEdicion = false;
  errorEdicion: string | null = null;

  constructor(
    private progresoService: ProgresoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  irARegistrarLibre(): void {
    this.router.navigate(['/progreso/seleccionar-ejercicio']);
  }

  verEvolucion(fila: HistorialFila): void {
    const key = fila.ejercicio_key ?? (fila.ejercicio_tipo === 'maquina'
      ? (fila.maquina_id ?? '')
      : (fila.nombre_libre ?? ''));
    if (key) this.cargarEvolucion(key);
  }

  abrirEdicionSesion(fila: HistorialFila): void {
    const key = fila.ejercicio_key ?? (fila.ejercicio_tipo === 'maquina'
      ? (fila.maquina_id ?? '')
      : (fila.nombre_libre ?? ''));
    const fecha = fila.fecha.substring(0, 10);

    if (!key || !fecha) return;

    this.sesion = null;
    this.errorSesion = null;
    this.cargandoSesion = true;
    this.edicionVisible = true;

    this.progresoService
      .obtenerSesion(key, fecha)
      .pipe(finalize(() => (this.cargandoSesion = false)))
      .subscribe({
        next: (s: SesionDetalle) => (this.sesion = s),
        error: (err: any) => {
          this.errorSesion =
            err?.error?.error?.message ?? 'No se pudo cargar la sesión.';
        },
      });
  }

  cerrarEdicionSesion(): void {
    this.edicionVisible = false;
    setTimeout(() => {
      this.sesion = null;
      this.serieEnEdicion = null;
      this.errorSesion = null;
      this.errorEdicion = null;
    }, 250);
  }

  get tituloSheet(): string {
    return this.sesion?.ejercicio ?? 'Editar series';
  }

  // ----- Edición de serie individual dentro del sheet -----

  editarSerie(s: SerieEnSesion): void {
    this.serieEnEdicion = s;
    this.metricasEdicion = metricasFormulario(s);
    this.errorEdicion = null;
  }

  cancelarEdicionSerie(): void {
    this.serieEnEdicion = null;
    this.errorEdicion = null;
  }


  guardarEdicionSerie(): void {
    if (!this.serieEnEdicion || this.guardandoEdicion || !metricasValidas(this.metricasEdicion)) return;

    this.guardandoEdicion = true;
    this.errorEdicion = null;

    const id = this.serieEnEdicion.id;
    const payload = metricasPayload(this.metricasEdicion);

    this.progresoService
      .actualizarSerie(id, payload)
      .pipe(finalize(() => (this.guardandoEdicion = false)))
      .subscribe({
        next: (actualizado: any) => {
          if (this.sesion) {
            this.sesion = {
              ...this.sesion,
              series: this.sesion.series.map(s =>
                s.id === actualizado.id
                  ? { ...s, ...actualizado }
                  : s,
              ),
            };
          }
          this.serieEnEdicion = null;
          // Refrescamos el historial y el gráfico para que reflejen el cambio
          this.refrescarSilencioso();
        },
        error: (err: any) => {
          this.errorEdicion =
            err?.error?.error?.message ?? 'No se pudo actualizar la serie.';
        },
      });
  }

  // ----- Helpers -----

  get ejercicioDestacado(): string {
    return this.evolucion?.ejercicio ?? '';
  }

  trackByFila(_: number, f: HistorialFila): string {
    return `${f.ejercicio_key ?? f.maquina_id ?? f.nombre_libre}-${f.modalidad}-${f.fecha}`;
  }

  trackBySerie(_: number, s: SerieEnSesion): string {
    return s.id;
  }

  private refrescarSilencioso(): void {
    // Recargamos historial y evolución sin tocar los flags de loading
    this.progresoService.listarHistorial().subscribe({
      next: (data: HistorialFila[]) => {
        this.historial = data;
      },
    });

    if (this.evolucion) {
      const key = this.evolucion.ejercicio_key ?? this.evolucion.maquina_id ?? this.evolucion.nombre_libre ?? '';
      if (key) {
        this.progresoService.obtenerEvolucion(key).subscribe({
          next: (e: Evolucion) => (this.evolucion = e),
        });
      }
    }
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.progresoService
      .listarHistorial()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: HistorialFila[]) => {
          this.historial = data;
          if (data.length > 0) {
            const first = data[0];
            const key = first.ejercicio_key ?? (first.ejercicio_tipo === 'maquina'
              ? (first.maquina_id ?? '')
              : (first.nombre_libre ?? ''));
            if (key) this.cargarEvolucion(key);
          }
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar el historial.';
          this.historial = [];
        },
      });
  }

  private cargarEvolucion(ejercicio: string): void {
    this.cargandoEvolucion = true;
    this.progresoService
      .obtenerEvolucion(ejercicio)
      .pipe(finalize(() => (this.cargandoEvolucion = false)))
      .subscribe({
        next: (e: Evolucion) => (this.evolucion = e),
        error: () => (this.evolucion = null),
      });
  }

}
