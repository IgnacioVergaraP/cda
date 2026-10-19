import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ProfesorService } from '../../services/profesor.service';
import { Rutina } from '../../../rutinas/models/rutina.model';

@Component({
  selector: 'app-profesor-rutinas-lista',
  templateUrl: './rutinas-lista.component.html',
  styleUrls: ['./rutinas-lista.component.scss'],
})
export class RutinasListaComponent implements OnInit {

  rutinas: Rutina[] = [];
  filtradas: Rutina[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  filtro: 'activas' | 'archivadas' | 'todas' = 'activas';
  busqueda = '';

  // Modal para duplicar
  modalDuplicarVisible = false;
  rutinaADuplicar: Rutina | null = null;
  alumnos: { id: string; nombre: string }[] = [];
  nuevoAlumnoId: string | null = null;
  duplicando = false;
  errorDuplicar: string | null = null;

  constructor(
    private profesorService: ProfesorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get totalActivas(): number {
    return this.rutinas.filter(r => r.activa).length;
  }

  reintentar(): void {
    this.cargar();
  }

  irANueva(): void {
    this.router.navigate(['/profesor/rutinas/nueva']);
  }

  editar(r: Rutina): void {
    this.router.navigate(['/profesor/rutinas', r.id, 'editar']);
  }

  archivar(r: Rutina): void {
    if (!confirm(`¿Archivar la rutina "${r.titulo}"? El alumno va a dejar de verla en su listado principal, pero sigue guardada.`)) return;

    this.profesorService.archivarRutina(r.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  reactivar(r: Rutina): void {
    this.profesorService.reactivarRutina(r.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  // -------- Duplicar --------

  abrirDuplicar(r: Rutina): void {
    this.rutinaADuplicar = r;
    this.nuevoAlumnoId = null;
    this.errorDuplicar = null;
    this.modalDuplicarVisible = true;

    if (this.alumnos.length === 0) {
      this.profesorService.listarAlumnos().subscribe({
        next: (data) => (this.alumnos = data.map(a => ({ id: a.id, nombre: a.nombre }))),
      });
    }
  }

  cerrarDuplicar(): void {
    this.modalDuplicarVisible = false;
    setTimeout(() => {
      this.rutinaADuplicar = null;
      this.errorDuplicar = null;
    }, 200);
  }

  confirmarDuplicar(): void {
    if (!this.rutinaADuplicar || !this.nuevoAlumnoId || this.duplicando) return;

    this.duplicando = true;
    this.errorDuplicar = null;

    this.profesorService
      .duplicarRutina(this.rutinaADuplicar.id, { nuevo_alumno_id: this.nuevoAlumnoId })
      .pipe(finalize(() => (this.duplicando = false)))
      .subscribe({
        next: () => {
          this.cerrarDuplicar();
          this.cargar();
        },
        error: (err: any) => {
          this.errorDuplicar =
            err?.error?.error?.message ?? 'No se pudo duplicar la rutina.';
        },
      });
  }

  // -------- Filtros --------

  setFiltro(f: 'activas' | 'archivadas' | 'todas'): void {
    this.filtro = f;
    this.aplicarFiltros();
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  trackById(_: number, r: Rutina): string {
    return r.id;
  }

  private aplicarFiltros(): void {
    let res = this.rutinas;

    if (this.filtro === 'activas') res = res.filter(r => r.activa);
    if (this.filtro === 'archivadas') res = res.filter(r => !r.activa);

    const q = this.busqueda.trim().toLowerCase();
    if (q) res = res.filter(r => r.titulo.toLowerCase().includes(q));

    this.filtradas = res;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarRutinas(true)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Rutina[]) => {
          this.rutinas = data;
          this.aplicarFiltros();
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar las rutinas.';
          this.rutinas = [];
          this.filtradas = [];
        },
      });
  }
}