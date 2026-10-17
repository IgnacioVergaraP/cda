import { pesoEnKg } from '../../../../shared/utils/peso';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  ActualizarSeriePayload,
  CrearSeriePayload,
  SerieConfirmada,
  TipoEjercicio,
} from '../../models/progreso.model';
import { ProgresoService } from '../../services/progreso.service';

@Component({
  selector: 'app-progreso-registrar',
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.scss'],
})
export class RegistrarComponent implements OnInit {

  tipo: TipoEjercicio = 'maquina';
  maquinaId: string | null = null;
  nombreLibre: string | null = null;
  nombreVisible = '';
  rutinaId: string | null = null;
  rutaRetorno = '/progreso';
  seriesObjetivo: number | null = null;

  pesoSugerido = '';
  peso = 40;
  repeticiones = 10;

  series: SerieConfirmada[] = [];

  guardando = false;
  errorMensaje: string | null = null;
  exitoMensaje: string | null = null;

  // Sheet de edición
  edicionVisible = false;
  serieEnEdicion: SerieConfirmada | null = null;
  pesoEdicion = 0;
  repsEdicion = 0;
  guardandoEdicion = false;
  errorEdicion: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progresoService: ProgresoService,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const tipo = qp.get('tipo');
    const maquinaId = qp.get('maquina_id');
    const nombreLibre = qp.get('nombre');
    const rutinaId = qp.get('rutina_id');
    const volverA = qp.get('volver_a');
    const seriesObjetivo = qp.get('series');
    const pesoInicial = qp.get('peso');
    const repsInicial = qp.get('repeticiones');

    if (tipo === 'libre' && nombreLibre) {
      this.tipo = 'libre';
      this.nombreLibre = nombreLibre;
      this.nombreVisible = nombreLibre;
    } else if (tipo === 'maquina' && maquinaId) {
      this.tipo = 'maquina';
      this.maquinaId = maquinaId;
      this.nombreVisible = nombreLibre || maquinaId;
    } else {
      this.router.navigate(['/progreso/seleccionar-ejercicio']);
      return;
    }

    this.rutinaId = rutinaId;
    if (volverA?.startsWith('/') && !volverA.startsWith('//')) {
      this.rutaRetorno = volverA;
    }

    if (seriesObjetivo) {
      const n = Number(seriesObjetivo);
      if (!Number.isNaN(n) && n > 0) this.seriesObjetivo = n;
    }

    if (pesoInicial) {
      this.pesoSugerido = pesoInicial;
      this.peso = this.parsePeso(pesoInicial) ?? 0;
    }
    if (repsInicial) this.repeticiones = this.parseReps(repsInicial) ?? this.repeticiones;
  }

  get numeroSerieActual(): number {
    return this.series.length + 1;
  }

  get indicadorSerie(): string {
    if (this.seriesObjetivo) {
      const n = Math.min(this.numeroSerieActual, this.seriesObjetivo);
      return `Serie ${n} de ${this.seriesObjetivo}`;
    }
    return `Serie ${this.numeroSerieActual}`;
  }

  get puedeRegistrar(): boolean {
    return !this.guardando && this.peso > 0 && this.repeticiones > 0;
  }

  onPesoChange(v: number): void { this.peso = v; }
  onRepsChange(v: number): void { this.repeticiones = v; }

  registrarSerie(): void {
    if (!this.puedeRegistrar) return;

    this.guardando = true;
    this.errorMensaje = null;

    const payload: CrearSeriePayload = {
      ejercicio_tipo: this.tipo,
      peso: `${this.peso} kg`,
      repeticiones: String(this.repeticiones),
      maquina_id: this.maquinaId,
      nombre_libre: this.nombreLibre,
      rutina_id: this.rutinaId,
      numero_serie: this.numeroSerieActual,
    };

    this.progresoService
      .registrarSerie(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (creado: any) => {
          this.series = [
            ...this.series,
            {
              id: creado.id,
              numero_serie: creado.numero_serie,
              peso: creado.peso,
              repeticiones: creado.repeticiones,
            },
          ];
          this.exitoMensaje = `Serie ${creado.numero_serie} registrada`;
          setTimeout(() => (this.exitoMensaje = null), 1500);
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo registrar la serie.';
        },
      });
  }

  // ----- Edición -----

  abrirEdicion(serie: SerieConfirmada): void {
    this.serieEnEdicion = serie;
    this.pesoEdicion = this.parsePeso(serie.peso) ?? 0;
    this.repsEdicion = this.parseReps(serie.repeticiones) ?? 0;
    this.errorEdicion = null;
    this.edicionVisible = true;
  }

  cerrarEdicion(): void {
    this.edicionVisible = false;
    setTimeout(() => {
      this.serieEnEdicion = null;
      this.errorEdicion = null;
    }, 250);
  }

  onPesoEdicionChange(v: number): void { this.pesoEdicion = v; }
  onRepsEdicionChange(v: number): void { this.repsEdicion = v; }

  guardarEdicion(): void {
    if (!this.serieEnEdicion || this.guardandoEdicion) return;

    this.guardandoEdicion = true;
    this.errorEdicion = null;

    const payload: ActualizarSeriePayload = {
      peso: `${this.pesoEdicion} kg`,
      repeticiones: String(this.repsEdicion),
    };

    this.progresoService
      .actualizarSerie(this.serieEnEdicion.id, payload)
      .pipe(finalize(() => (this.guardandoEdicion = false)))
      .subscribe({
        next: (actualizado: any) => {
          this.series = this.series.map(s =>
            s.id === actualizado.id
              ? { ...s, peso: actualizado.peso, repeticiones: actualizado.repeticiones }
              : s,
          );
          this.cerrarEdicion();
        },
        error: (err: any) => {
          this.errorEdicion =
            err?.error?.error?.message ?? 'No se pudo actualizar la serie.';
        },
      });
  }

  terminar(): void {
    this.router.navigateByUrl(this.rutaRetorno);
  }

  cancelar(): void {
    this.router.navigateByUrl(this.rutaRetorno);
  }

  trackBySerie(_: number, s: SerieConfirmada): string {
    return s.id;
  }

  private parsePeso(s: string): number | null {
    return pesoEnKg(s);
  }

  private parseReps(s: string): number | null {
    const match = s.match(/\d+/);
    return match ? Number(match[0]) : null;
  }
}