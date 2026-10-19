import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { User } from '../../../../shared/models/user.model';
import { ResumenAlumno } from '../../models/alumno.model';
import { ProfesorService } from '../../services/profesor.service';

type TabActiva = 'perfil' | 'rutinas' | 'progreso' | 'solicitudes';

@Component({
  selector: 'app-profesor-detalle-alumno',
  templateUrl: './detalle-alumno.component.html',
  styleUrls: ['./detalle-alumno.component.scss'],
})
export class DetalleAlumnoComponent implements OnInit {

  alumnoId = '';
  perfil: User | null = null;
  resumen: ResumenAlumno | null = null;

  cargando = false;
  errorMensaje: string | null = null;

  tabActiva: TabActiva = 'perfil';

  constructor(
    private route: ActivatedRoute,
    private profesorService: ProfesorService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMensaje = 'Alumno no encontrado.';
      return;
    }
    this.alumnoId = id;
    this.cargar();
  }

  reintentar(): void {
    if (this.alumnoId) this.cargar();
  }

  setTab(t: TabActiva): void {
    this.tabActiva = t;
  }

  onPerfilActualizado(u: User): void {
    this.perfil = u;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .obtenerPerfilAlumno(this.alumnoId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => {
          this.perfil = data.perfil;
          this.resumen = data.resumen;
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar el alumno.';
        },
      });
  }
}