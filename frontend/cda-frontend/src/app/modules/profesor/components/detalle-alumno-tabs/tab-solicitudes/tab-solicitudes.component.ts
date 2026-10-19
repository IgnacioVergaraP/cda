import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { ProfesorService } from '../../../services/profesor.service';
import { SolicitudRutina } from '../../../models/solicitud-rutina.model';
import { User } from '../../../../../shared/models/user.model';

type FiltroEstado = 'todas' | 'activas' | 'resueltas' | 'canceladas';

@Component({
  selector: 'app-tab-solicitudes',
  templateUrl: './tab-solicitudes.component.html',
  styleUrls: ['./tab-solicitudes.component.scss'],
})
export class TabSolicitudesComponent implements OnInit, OnChanges {

  @Input() alumno!: User;

  solicitudes: SolicitudRutina[] = [];
  filtradas: SolicitudRutina[] = [];

  cargando = false;
  errorMensaje: string | null = null;

  filtro: FiltroEstado = 'todas';

  readonly filtros: { value: FiltroEstado; label: string }[] = [
    { value: 'todas',      label: 'Todas' },
    { value: 'activas',    label: 'Activas' },
    { value: 'resueltas',  label: 'Resueltas' },
    { value: 'canceladas', label: 'Canceladas' },
  ];

  constructor(private profesorService: ProfesorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.alumno?.id) this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  setFiltro(f: FiltroEstado): void {
    this.filtro = f;
    this.aplicarFiltro();
  }

  trackById(_: number, s: SolicitudRutina): string {
    return s.id;
  }

  private aplicarFiltro(): void {
    if (this.filtro === 'todas') {
      this.filtradas = this.solicitudes;
      return;
    }
    if (this.filtro === 'activas') {
      this.filtradas = this.solicitudes.filter(s =>
        s.estado === 'pendiente' || s.estado === 'en_proceso',
      );
      return;
    }
    if (this.filtro === 'resueltas') {
      this.filtradas = this.solicitudes.filter(s => s.estado === 'resuelta');
      return;
    }
    if (this.filtro === 'canceladas') {
      this.filtradas = this.solicitudes.filter(s =>
        s.estado === 'cancelada' || s.estado === 'rechazada',
      );
    }
  }

  private cargar(): void {
    if (!this.alumno?.id) return;

    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
        .listarSolicitudesRutinaDeAlumno(this.alumno.id)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
        next: (data) => {
            this.solicitudes = data;
            this.aplicarFiltro();
        },
        error: (err: any) => {
            this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar las solicitudes.';
            this.solicitudes = [];
            this.filtradas = [];
        },
        });
    }
}