import { Subscription } from 'rxjs';
import { CatalogoService } from '../../../ejercicios/services/catalogo.service';
import { CATEGORIAS, CategoriaEjercicio, Recurso } from '../../../ejercicios/models/catalogo.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  CrearSolicitudPayload,
  Solicitud,
} from '../../models/solicitud.model';
import { ProfesorService } from '../../services/profesor.service';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';

@Component({
  selector: 'app-profesor-subir-ejercicio',
  templateUrl: './subir-ejercicio.component.html',
  styleUrls: ['./subir-ejercicio.component.scss'],
})
export class SubirEjercicioComponent implements OnInit, OnDestroy {

  readonly categorias = CATEGORIAS;
  categoria: CategoriaEjercicio = 'maquina';
  recursos: Recurso[] = [];
  recursosSeleccionados: Recurso[] = [];
  buscarRecurso = '';
  recursosHayMas = false;
  cargandoRecursos = false;
  errorRecursos: string | null = null;
  private cargaRecursos?: Subscription;
  ngOnDestroy(): void { this.cargaRecursos?.unsubscribe(); }
  cargarRecursos(mas = false): void {
    this.cargaRecursos?.unsubscribe();
    if (!mas) this.recursos = [];
    this.cargandoRecursos = true;
    this.errorRecursos = null;
    this.cargaRecursos = this.catalogoService.recursos({ tipo: '', buscar: this.buscarRecurso.trim(), desde: mas ? this.recursos.length : 0 })
      .pipe(finalize(() => this.cargandoRecursos = false)).subscribe({
        next: p => { this.recursos = [...this.recursos, ...p.items]; this.recursosHayMas = p.hay_mas; },
        error: () => this.errorRecursos = 'No pudimos cargar los recursos.',
      });
  }
  recursoSeleccionado(id: string): boolean { return this.recursosSeleccionados.some(r => r.id === id); }
  toggleRecurso(recurso: Recurso): void {
    this.recursosSeleccionados = this.recursoSeleccionado(recurso.id)
      ? this.recursosSeleccionados.filter(r => r.id !== recurso.id)
      : this.recursosSeleccionados.length < 30 ? [...this.recursosSeleccionados, recurso] : this.recursosSeleccionados;
  }
  solicitudes: Solicitud[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  // Sheet de creación
  sheetVisible = false;
  form: FormGroup;
  gruposSeleccionados: string[] = [];
  guardando = false;
  errorCreacion: string | null = null;
  exitoCreacion: string | null = null;

  readonly gruposDisponibles = GRUPOS_MUSCULARES;

  constructor(
    private profesorService: ProfesorService,
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      video_url: [''],
      imagen_url: [''],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get nombreCtrl() { return this.form.get('nombre')!; }
  get descripcionCtrl() { return this.form.get('descripcion')!; }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  // -------- Sheet --------

  abrirSheet(): void {
    this.form.reset({
      nombre: '',
      descripcion: '',
      video_url: '',
      imagen_url: '',
    });
    this.gruposSeleccionados = [];
    this.categoria = 'maquina';
    this.recursosSeleccionados = [];
    this.buscarRecurso = '';
    this.cargarRecursos();
    this.errorCreacion = null;
    this.sheetVisible = true;
  }

  cerrarSheet(): void {
    this.sheetVisible = false;
    setTimeout(() => {
      this.errorCreacion = null;
    }, 250);
  }

  toggleGrupo(g: string): void {
    const idx = this.gruposSeleccionados.indexOf(g);
    if (idx >= 0) {
      this.gruposSeleccionados = this.gruposSeleccionados.filter(x => x !== g);
    } else {
      if (this.gruposSeleccionados.length >= 8) return;
      this.gruposSeleccionados = [...this.gruposSeleccionados, g];
    }
  }

  estaSeleccionado(g: string): boolean {
    return this.gruposSeleccionados.includes(g);
  }

  get puedeGuardar(): boolean {
    return !this.guardando
      && this.form.valid
      && (this.categoria === 'cardio' || this.gruposSeleccionados.length > 0)
      && this.recursosSeleccionados.length > 0
      && (this.categoria !== 'maquina' || this.recursosSeleccionados.some(r => r.tipo === 'maquina'));
  }

  guardar(): void {
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorCreacion = null;

    const raw = this.form.value;
    const payload: CrearSolicitudPayload = {
      categoria: this.categoria,
      recurso_ids: this.recursosSeleccionados.map(r => r.id),
      nombre: raw.nombre.trim(),
      grupos_musculares: this.gruposSeleccionados,
      descripcion: raw.descripcion.trim(),
      video_url: (raw.video_url ?? '').trim(),
      imagen_url: (raw.imagen_url ?? '').trim(),
    };

    this.profesorService
      .crearSolicitud(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (creada: Solicitud) => {
          this.solicitudes = [creada, ...this.solicitudes];
          this.exitoCreacion = 'Solicitud enviada a revisión';
          setTimeout(() => (this.exitoCreacion = null), 2500);
          this.cerrarSheet();
        },
        error: (err: any) => {
          this.errorCreacion =
            err?.error?.error?.message ?? 'No se pudo crear la solicitud.';
        },
      });
  }

  // -------- Cancelar --------

  cancelarSolicitud(s: Solicitud): void {
    this.profesorService
      .cancelarSolicitud(s.id)
      .subscribe({
        next: (actualizada: Solicitud) => {
          this.solicitudes = this.solicitudes.map(x =>
            x.id === actualizada.id ? actualizada : x,
          );
        },
        error: () => {},
      });
  }

  // -------- Carga --------

  reintentar(): void {
    this.cargar();
  }

  trackById(_: number, s: Solicitud): string {
    return s.id;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarMisSolicitudes()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Solicitud[]) => (this.solicitudes = data),
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar las solicitudes.';
          this.solicitudes = [];
        },
      });
  }
}