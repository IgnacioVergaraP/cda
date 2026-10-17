import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';

import { etiquetaDisciplina, etiquetaNivel } from '../../models/publicacion.model';
import { Ejercicio, Rutina } from '../../models/rutina.model';
import { RutinasService } from '../../services/rutinas.service';

@Component({
  selector: 'app-rutinas-detalle',
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss'],
})
export class DetalleComponent implements OnInit {

  rutina: Rutina | null = null;
  esPublica = false;
  gestion = false;
  guardando = false;
  errorGuardar: string | null = null;
  readonly etiquetaDisciplina = etiquetaDisciplina;
  readonly etiquetaNivel = etiquetaNivel;
  cargando = false;
  errorMensaje: string | null = null;

  sheetVisible = false;
  ejercicioEnSheet: Ejercicio | null = null;

  sheetVideoUrlSeguro: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutinasService: RutinasService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.esPublica = this.route.snapshot.data['esPublica'] === true;
    this.gestion = this.route.snapshot.data['gestion'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMensaje = 'Rutina no encontrada.';
      return;
    }
    this.cargar(id);
  }

  reintentar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(id);
  }

  abrirSheet(ejercicio: Ejercicio): void {
    this.ejercicioEnSheet = ejercicio;
    this.sheetVideoUrlSeguro = this.construirVideoUrlSeguro(ejercicio);
    this.sheetVisible = true;
  }

  cerrarSheet(): void {
    this.sheetVisible = false;
    setTimeout(() => {
      this.ejercicioEnSheet = null;
      this.sheetVideoUrlSeguro = null;
    }, 250);
  }

  get sheetEsMaquina(): boolean {
    return this.ejercicioEnSheet?.tipo === 'maquina';
  }

  get sheetEsLibre(): boolean {
    return this.ejercicioEnSheet?.tipo === 'libre';
  }

  get sheetTitulo(): string {
    if (!this.ejercicioEnSheet) return '';
    if (this.ejercicioEnSheet.catalogo) return this.ejercicioEnSheet.catalogo.nombre;
    return this.sheetEsMaquina
      ? (this.ejercicioEnSheet.maquina?.nombre ?? 'Máquina')
      : (this.ejercicioEnSheet.nombre ?? 'Ejercicio');
  }

  get sheetDescripcion(): string | null {
    if (!this.ejercicioEnSheet) return null;
    if (this.ejercicioEnSheet.catalogo) return this.ejercicioEnSheet.catalogo.descripcion;
    return this.sheetEsMaquina
      ? (this.ejercicioEnSheet.maquina?.descripcion ?? null)
      : (this.ejercicioEnSheet.descripcion ?? null);
  }

  get sheetMuscles(): string[] {
    if (!this.ejercicioEnSheet) return [];
    if (this.ejercicioEnSheet.catalogo) return this.ejercicioEnSheet.catalogo.grupos_musculares;
    if (this.ejercicioEnSheet.tipo === 'maquina') {
      return this.ejercicioEnSheet.maquina?.grupos_musculares ?? this.rutina?.grupos_musculares ?? [];
    }
    return this.rutina?.grupos_musculares ?? [];
  }

  get sheetResumenSeries(): string {
    if (!this.ejercicioEnSheet) return '';
    return `${this.ejercicioEnSheet.series} × ${this.ejercicioEnSheet.repeticiones}`;
  }

  verDetalleMaquina(): void {
    if (this.ejercicioEnSheet?.ejercicio_catalogo_id) {
      const id = this.ejercicioEnSheet.ejercicio_catalogo_id;
      this.cerrarSheet();
      this.router.navigate(['/ejercicios', id]);
      return;
    }
    if (!this.ejercicioEnSheet?.maquina_id) return;
    const id = this.ejercicioEnSheet.maquina_id;
    this.cerrarSheet();
    this.router.navigate(['/maquinas', id]);
  }

  registrarSeries(): void {
    if (this.ejercicioEnSheet) this.iniciarRegistroSerie(this.ejercicioEnSheet);
  }

  registrarSerieDesdeFila(ejercicio: Ejercicio): void {
    this.iniciarRegistroSerie(ejercicio);
  }

  private iniciarRegistroSerie(ej: Ejercicio): void {
    if (!this.rutina || this.esPublica) return;
    const esMaquina = ej.tipo === 'maquina';

    if (this.sheetVisible) this.cerrarSheet();

    this.router.navigate(['/progreso/registrar'], {
      queryParams: {
        ejercicio_catalogo_id: ej.ejercicio_catalogo_id ?? null,
        tipo: ej.tipo,
        maquina_id: esMaquina ? (ej.maquina_id ?? null) : null,
        nombre: esMaquina
          ? (ej.maquina?.nombre ?? ej.maquina_id ?? '')
          : (ej.nombre ?? ''),
        rutina_id: this.rutina.id,
        volver_a: this.router.url,
        series: ej.catalogo?.categoria === 'cardio' ? null : ej.series,
        duracion_minutos: ej.prescripcion_cardio?.duracion_minutos ?? null,
        distancia_km: ej.prescripcion_cardio?.distancia_km ?? null,
        peso: ej.peso_sugerido ?? null,
        repeticiones: ej.repeticiones,
      },
    });
  }

  guardarEnMisRutinas(): void {
    if (!this.rutina || this.guardando || this.gestion) return;
    if (this.rutina.copia_id) {
      this.router.navigate(['/rutinas', this.rutina.copia_id]);
      return;
    }
    this.guardando = true;
    this.errorGuardar = null;
    this.rutinasService.guardarPublica(this.rutina.id)
      .pipe(finalize(() => (this.guardando = false))).subscribe({
        next: copia => this.router.navigate(['/rutinas', copia.id]),
        error: err => { this.errorGuardar = err?.error?.error?.message ?? 'No se pudo guardar la rutina.'; },
      });
  }

  trackByEjercicio(_: number, e: Ejercicio): string {
    return e.id;
  }

  private construirVideoUrlSeguro(ejercicio: Ejercicio): SafeResourceUrl | null {
    const url = ejercicio.catalogo?.video_url ?? ejercicio.maquina?.video_url;
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && ['www.youtube.com', 'www.youtube-nocookie.com'].includes(parsed.hostname)
          && parsed.pathname.startsWith('/embed/')) return this.sanitizer.bypassSecurityTrustResourceUrl(parsed.href);
    } catch { /* Los videos antiguos no válidos no se incrustan. */ }
    return null;
  }

  private cargar(id: string): void {
    this.cargando = true;
    this.errorMensaje = null;

    const solicitud = this.esPublica
      ? this.rutinasService.obtenerPublica(id, this.gestion) : this.rutinasService.obtenerDetalle(id);
    solicitud
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (r: Rutina) => (this.rutina = r),
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar la rutina.';
          this.rutina = null;
        },
      });
  }
}
