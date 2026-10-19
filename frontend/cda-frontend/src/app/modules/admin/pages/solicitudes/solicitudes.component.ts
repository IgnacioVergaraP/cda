import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import { Solicitud } from '../../../profesor/models/solicitud.model';

@Component({
  selector: 'app-admin-solicitudes',
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {

  solicitudes: Solicitud[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  // Modal rechazo
  modalRechazoVisible = false;
  solicitudARechazar: Solicitud | null = null;
  motivoRechazo = '';
  enviandoRechazo = false;
  errorRechazo: string | null = null;

  // Modal aprobar
  modalAprobarVisible = false;
  solicitudAAprobar: Solicitud | null = null;
  aprobando = false;
  errorAprobar: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  reintentar(): void { this.cargar(); }
  trackById(_: number, s: Solicitud): string { return s.id; }

  abrirAprobar(s: Solicitud): void {
    this.solicitudAAprobar = s;
    this.errorAprobar = null;
    this.modalAprobarVisible = true;
  }

  cerrarAprobar(): void {
    this.modalAprobarVisible = false;
    setTimeout(() => (this.solicitudAAprobar = null), 200);
  }

  confirmarAprobar(): void {
    if (!this.solicitudAAprobar || this.aprobando) return;
    this.aprobando = true;
    this.errorAprobar = null;

    this.adminService
      .aprobarSolicitud(this.solicitudAAprobar.id)
      .pipe(finalize(() => (this.aprobando = false)))
      .subscribe({
        next: () => {
          this.cerrarAprobar();
          this.cargar();
        },
        error: (err: any) => {
          this.errorAprobar = err?.error?.error?.message ?? 'No se pudo aprobar.';
        },
      });
  }

  abrirRechazo(s: Solicitud): void {
    this.solicitudARechazar = s;
    this.motivoRechazo = '';
    this.errorRechazo = null;
    this.modalRechazoVisible = true;
  }

  cerrarRechazo(): void {
    this.modalRechazoVisible = false;
    setTimeout(() => {
      this.solicitudARechazar = null;
      this.motivoRechazo = '';
      this.errorRechazo = null;
    }, 200);
  }

  confirmarRechazo(): void {
    if (!this.solicitudARechazar || this.enviandoRechazo) return;
    if (this.motivoRechazo.trim().length < 5) {
      this.errorRechazo = 'Escribí al menos 5 caracteres.';
      return;
    }

    this.enviandoRechazo = true;
    this.errorRechazo = null;

    this.adminService
      .rechazarSolicitud(this.solicitudARechazar.id, this.motivoRechazo.trim())
      .pipe(finalize(() => (this.enviandoRechazo = false)))
      .subscribe({
        next: () => {
          this.cerrarRechazo();
          this.cargar();
        },
        error: (err: any) => {
          this.errorRechazo = err?.error?.error?.message ?? 'No se pudo rechazar.';
        },
      });
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.adminService
      .listarSolicitudesPendientes()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => (this.solicitudes = data),
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar.';
          this.solicitudes = [];
        },
      });
  }
}