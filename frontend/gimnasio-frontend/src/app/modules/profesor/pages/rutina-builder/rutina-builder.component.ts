import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { RutinasService } from '../../../rutinas/services/rutinas.service';
import { ProfesorService } from '../../services/profesor.service';
import {
  CrearRutinaPayload,
  EditarRutinaPayload,
  EjercicioBuilder,
  ejercicioExistenteABuilder,
  generarUid,
  pesoBuilderValido,
} from '../../models/rutina-builder.model';
import { Rutina } from '../../../rutinas/models/rutina.model';
import { AlumnoListItem } from '../../models/alumno.model';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';

type Modo = 'nueva' | 'editar' | 'duplicar';

@Component({
  selector: 'app-profesor-rutina-builder',
  templateUrl: './rutina-builder.component.html',
  styleUrls: ['./rutina-builder.component.scss'],
})
export class RutinaBuilderComponent implements OnInit {

  esAlumno = false;
  modo: Modo = 'nueva';
  rutinaId: string | null = null;

  titulo = '';
  gruposSeleccionados: string[] = [];
  ejercicios: EjercicioBuilder[] = [];

  alumnos: AlumnoListItem[] = [];
  alumnoId: string | null = null;
  cargandoAlumnos = false;

  cargando = false;
  guardando = false;
  errorMensaje: string | null = null;
  errorGuardar: string | null = null;

  readonly gruposDisponibles = GRUPOS_MUSCULARES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profesorService: ProfesorService,
    private rutinasService: RutinasService,
  ) {}

  ngOnInit(): void {
    this.esAlumno = this.route.snapshot.data['esAlumno'] === true;
    if (this.esAlumno) {
      this.agregarEjercicioVacio();
      return;
    }

    const url = this.router.url;
    const id = this.route.snapshot.paramMap.get('id');

    if (url.includes('/duplicar')) {
      this.modo = 'duplicar';
      this.rutinaId = id;
    } else if (id) {
      this.modo = 'editar';
      this.rutinaId = id;
    } else {
      this.modo = 'nueva';
    }

    const qp = this.route.snapshot.queryParamMap;
    const alumnoQuery = qp.get('alumno_id');

    if (this.modo === 'nueva') {
      if (alumnoQuery) this.alumnoId = alumnoQuery;
      this.cargarAlumnos();
      this.agregarEjercicioVacio();
    } else if (this.modo === 'editar' && this.rutinaId) {
      this.cargarRutina(this.rutinaId);
    } else if (this.modo === 'duplicar' && this.rutinaId) {
      this.cargarRutinaParaDuplicar(this.rutinaId);
      this.cargarAlumnos();
    }
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  get tituloPagina(): string {
    if (this.modo === 'nueva') return 'Nueva rutina';
    if (this.modo === 'editar') return 'Editar rutina';
    return 'Duplicar rutina';
  }

  get puedeGuardar(): boolean {
    if (this.guardando) return false;
    if (this.titulo.trim().length < 3 || this.titulo.trim().length > 80) return false;
    if (!this.esAlumno && this.modo !== 'editar' && !this.alumnoId) return false;
    if (this.ejercicios.length === 0 || this.ejercicios.length > 30) return false;

    for (const e of this.ejercicios) {
      if (!e.repeticiones.trim()) return false;
      if (!pesoBuilderValido(e)) return false;
      if (e.tipo === 'maquina' && !e.maquina_id) return false;
      if (e.tipo === 'libre' && !e.nombre?.trim()) return false;
    }

    return true;
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

  // -------- Ejercicios --------

  agregarEjercicioVacio(): void {
    // Minimizamos los anteriores al agregar uno nuevo (menos scroll)
    this.ejercicios = this.ejercicios.map(e => ({ ...e, minimizado: true }));
    this.ejercicios = [
      ...this.ejercicios,
      {
        uid: generarUid(),
        tipo: 'maquina',
        series: 3,
        repeticiones: '10',
        peso_sugerido: '',
        peso_unidad: 'kg',
        peso_valor: null,
        peso_otro: '',
        maquina_id: null,
        maquina_nombre: null,
        minimizado: false,
      },
    ];
  }

  onEjercicioCambio(uid: string, actualizado: EjercicioBuilder): void {
    this.ejercicios = this.ejercicios.map(e => e.uid === uid ? actualizado : e);
  }

  eliminarEjercicio(uid: string): void {
    this.ejercicios = this.ejercicios.filter(e => e.uid !== uid);
  }

  subirEjercicio(indice: number): void {
    if (indice <= 0) return;
    const copia = [...this.ejercicios];
    [copia[indice - 1], copia[indice]] = [copia[indice], copia[indice - 1]];
    this.ejercicios = copia;
  }

  bajarEjercicio(indice: number): void {
    if (indice >= this.ejercicios.length - 1) return;
    const copia = [...this.ejercicios];
    [copia[indice + 1], copia[indice]] = [copia[indice], copia[indice + 1]];
    this.ejercicios = copia;
  }

  toggleMinimizado(uid: string): void {
    this.ejercicios = this.ejercicios.map(e =>
      e.uid === uid ? { ...e, minimizado: !e.minimizado } : e
    );
  }

  trackByUid(_: number, e: EjercicioBuilder): string {
    return e.uid;
  }

  // -------- Guardar --------

  guardar(): void {
    if (!this.puedeGuardar) {
      this.errorGuardar = 'Completá todos los campos obligatorios antes de guardar (incluido el peso sugerido).';
      return;
    }

    this.guardando = true;
    this.errorGuardar = null;

    const ejerciciosPayload = this.ejercicios.map(e => ({
      id: e.uid.startsWith('b-') ? undefined : e.uid,
      tipo: e.tipo,
      series: e.series,
      repeticiones: e.repeticiones.trim(),
      peso_sugerido: e.peso_sugerido.trim(),
      maquina_id: e.tipo === 'maquina' ? e.maquina_id : null,
      nombre: e.tipo === 'libre' ? e.nombre?.trim() : null,
      descripcion: e.tipo === 'libre' ? e.descripcion?.trim() || null : null,
    }));

    if (this.esAlumno) {
      this.rutinasService.crear({
        titulo: this.titulo.trim(),
        grupos_musculares: this.gruposSeleccionados,
        ejercicios: ejerciciosPayload,
      }).pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: (rutina) => this.router.navigate(['/rutinas', rutina.id]),
          error: (err: any) => {
            this.errorGuardar = err?.error?.error?.message ?? 'No se pudo crear la rutina.';
          },
        });
      return;
    }

    if (this.modo === 'editar' && this.rutinaId) {
      const payload: EditarRutinaPayload = {
        titulo: this.titulo.trim(),
        grupos_musculares: this.gruposSeleccionados,
        ejercicios: ejerciciosPayload,
      };
      this.profesorService
        .editarRutina(this.rutinaId, payload)
        .pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: () => this.volver(),
          error: (err: any) => {
            this.errorGuardar =
              err?.error?.error?.message ?? 'No se pudo guardar la rutina.';
          },
        });
      return;
    }

    if (!this.alumnoId) return;

    const payload: CrearRutinaPayload = {
      alumno_id: this.alumnoId,
      titulo: this.titulo.trim(),
      grupos_musculares: this.gruposSeleccionados,
      ejercicios: ejerciciosPayload,
    };
    this.profesorService
      .crearRutina(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => this.volver(),
        error: (err: any) => {
          this.errorGuardar =
            err?.error?.error?.message ?? 'No se pudo crear la rutina.';
        },
      });
  }

  volver(): void {
    this.router.navigate([this.esAlumno ? '/rutinas' : '/profesor/rutinas']);
  }

  cancelar(): void {
    this.volver();
  }

  private cargarAlumnos(): void {
    this.cargandoAlumnos = true;
    this.profesorService
      .listarAlumnos()
      .pipe(finalize(() => (this.cargandoAlumnos = false)))
      .subscribe({
        next: (data) => (this.alumnos = data),
        error: () => (this.alumnos = []),
      });
  }

  private cargarRutina(id: string): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .obtenerRutina(id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (r: Rutina) => {
          this.titulo = r.titulo;
          this.gruposSeleccionados = [...r.grupos_musculares];
          this.alumnoId = r.alumno_id;
          this.ejercicios = r.ejercicios.map(ejercicioExistenteABuilder);
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar la rutina.';
        },
      });
  }

  private cargarRutinaParaDuplicar(id: string): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .obtenerRutina(id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (r: Rutina) => {
          this.titulo = r.titulo;
          this.gruposSeleccionados = [...r.grupos_musculares];
          this.ejercicios = r.ejercicios.map(ejercicioExistenteABuilder);
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar la rutina.';
        },
      });
  }
}