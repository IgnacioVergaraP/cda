import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ProfesorService } from '../../../services/profesor.service';
import { Rutina } from '../../../../rutinas/models/rutina.model';
import { User } from '../../../../../shared/models/user.model';

@Component({
  selector: 'app-tab-rutinas',
  templateUrl: './tab-rutinas.component.html',
  styleUrls: ['./tab-rutinas.component.scss'],
})
export class TabRutinasComponent implements OnInit, OnChanges {

  @Input() alumno!: User;

  rutinas: Rutina[] = [];
  cargando = false;
  errorMensaje: string | null = null;
  mostrarArchivadas = false;

  // Duplicar
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

  ngOnChanges(_: SimpleChanges): void {
    // Si cambia el alumno, recargamos
    if (this.alumno?.id) this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  toggleArchivadas(): void {
    this.mostrarArchivadas = !this.mostrarArchivadas;
    this.cargar();
  }

  irANuevaRutina(): void {
    this.router.navigate(['/profesor/rutinas/nueva'], {
      queryParams: { alumno_id: this.alumno.id },
    });
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
          // Si duplicó al mismo alumno, recargamos
          if (this.nuevoAlumnoId === this.alumno.id) {
            this.cargar();
          }
        },
        error: (err: any) => {
          this.errorDuplicar =
            err?.error?.error?.message ?? 'No se pudo duplicar la rutina.';
        },
      });
  }

  trackById(_: number, r: Rutina): string {
    return r.id;
  }

  private cargar(): void {
    if (!this.alumno?.id) return;

    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarRutinasDeAlumno(this.alumno.id, this.mostrarArchivadas)
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
}