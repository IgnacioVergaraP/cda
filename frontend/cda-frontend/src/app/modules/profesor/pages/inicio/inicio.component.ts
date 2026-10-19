import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { DashboardProfesor } from '../../models/alumno.model';
import { ProfesorService } from '../../services/profesor.service';
import { Horario } from '../../../admin/models/horario.model';

@Component({
  selector: 'app-profesor-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent implements OnInit {

  dashboard: DashboardProfesor | null = null;
  cargando = false;
  errorMensaje: string | null = null;

  // Horarios de hoy
  horariosHoy: Horario[] = [];
  cargandoHorarios = false;

  constructor(
    private profesorService: ProfesorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarHorariosHoy();
  }

  reintentar(): void {
    this.cargar();
  }

  irAAlumnos(): void {
    this.router.navigate(['/profesor/alumnos']);
  }

  irASubir(): void {
    this.router.navigate(['/profesor/subir']);
  }

  irAReportar(): void {
    this.router.navigate(['/profesor/reportar']);
  }

  irASolicitudesRutina(): void {
    this.router.navigate(['/profesor/solicitudes-rutina']);
  }

  get diaSemanaHoy(): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date().getDay()];
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .obtenerDashboard()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (d: DashboardProfesor) => (this.dashboard = d),
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar el dashboard.';
          this.dashboard = null;
        },
      });
  }

  private cargarHorariosHoy(): void {
    this.cargandoHorarios = true;

    this.profesorService
      .listarMisHorarios()
      .pipe(finalize(() => (this.cargandoHorarios = false)))
      .subscribe({
        next: (data: Horario[]) => {
          // JS usa 0=domingo, 1=lunes... Nuestro backend usa 0=lunes, 6=domingo.
          const hoyJs = new Date().getDay();
          const diaSemanaBackend = hoyJs === 0 ? 6 : hoyJs - 1;
          this.horariosHoy = data
            .filter(h => h.dia_semana === diaSemanaBackend)
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        },
        error: () => (this.horariosHoy = []),
      });
  }
}