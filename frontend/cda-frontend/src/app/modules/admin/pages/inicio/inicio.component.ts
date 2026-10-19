import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import { DashboardAdmin } from '../../models/admin.model';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-admin-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent implements OnInit {

  dashboard: DashboardAdmin = {
    solicitudes_ejercicios: 0,
    reportes_pendientes: 0,
    solicitudes_rutina_activas: 0,
    liberaciones_pendientes: 0,
  };

  cargando = false;
  errorMensaje: string | null = null;

  usuario: User | null = null;

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.usuarioActual;
    this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  irASolicitudes(): void { this.router.navigate(['/admin/solicitudes']); }
  irAReportes(): void { this.router.navigate(['/admin/reportes']); }
  irARutinas(): void { this.router.navigate(['/admin/rutinas']); }
  irALiberaciones(): void { this.router.navigate(['/admin/rutinas'], { queryParams: { tab: 'liberaciones' } }); }
  irAPerfil(): void { this.router.navigate(['/admin/perfil']); }

  cerrarSesion(): void {
    this.auth.logout(true);
  }

  get miembroDesde(): string {
    if (!this.usuario?.fecha_alta) return '—';
    const d = new Date(this.usuario.fecha_alta);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    forkJoin({
      solicitudes: this.adminService.contarSolicitudesPendientes().pipe(catchError(() => of({ count: 0 }))),
      reportes: this.adminService.contarReportes().pipe(catchError(() => of({ abiertos: 0, en_revision: 0, resueltos: 0, total_pendientes: 0 }))),
      solicitudesRutina: this.adminService.listarTodasSolicitudesRutina().pipe(catchError(() => of([]))),
      liberaciones: this.adminService.listarLiberacionesPendientes().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (r) => {
          const activas = r.solicitudesRutina.filter(
            (s: any) => s.estado === 'pendiente' || s.estado === 'en_proceso',
          ).length;

          this.dashboard = {
            solicitudes_ejercicios: r.solicitudes.count,
            reportes_pendientes: r.reportes.total_pendientes,
            solicitudes_rutina_activas: activas,
            liberaciones_pendientes: r.liberaciones.length,
          };
        },
        error: () => {
          this.errorMensaje = 'No se pudo cargar el dashboard.';
        },
      });
  }
}