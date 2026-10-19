import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AlumnoListItem } from '../../models/alumno.model';
import { ProfesorService } from '../../services/profesor.service';

@Component({
  selector: 'app-profesor-lista-alumnos',
  templateUrl: './lista-alumnos.component.html',
  styleUrls: ['./lista-alumnos.component.scss'],
})
export class ListaAlumnosComponent implements OnInit {

  alumnos: AlumnoListItem[] = [];
  filtrados: AlumnoListItem[] = [];

  cargando = false;
  errorMensaje: string | null = null;

  busqueda = '';

  constructor(private profesorService: ProfesorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  onBusquedaChange(): void {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) {
      this.filtrados = this.alumnos;
      return;
    }
    this.filtrados = this.alumnos.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q),
    );
  }

  reintentar(): void {
    this.cargar();
  }

  trackById(_: number, a: AlumnoListItem): string {
    return a.id;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarAlumnos()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: AlumnoListItem[]) => {
          this.alumnos = data;
          this.filtrados = data;
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar los alumnos.';
          this.alumnos = [];
          this.filtrados = [];
        },
      });
  }
}