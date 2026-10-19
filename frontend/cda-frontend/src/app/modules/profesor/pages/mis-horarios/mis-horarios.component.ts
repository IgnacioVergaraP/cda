import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { ProfesorService } from '../../services/profesor.service';
import { Horario } from '../../../admin/models/horario.model';

@Component({
  selector: 'app-profesor-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
})
export class MisHorariosComponent implements OnInit {

  horarios: Horario[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  constructor(private profesorService: ProfesorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  reintentar(): void { this.cargar(); }

  trackById(_: number, h: Horario): string { return h.id; }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .listarMisHorarios()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => (this.horarios = data),
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar tus horarios.';
          this.horarios = [];
        },
      });
  }
}