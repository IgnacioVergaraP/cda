import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import {
  EstadoSolicitudRutina,
  SolicitudRutina,
} from '../../../profesor/models/solicitud-rutina.model';

type Tab = 'todas' | 'liberaciones';
type FiltroEstado = 'todas' | EstadoSolicitudRutina;

@Component({
  selector: 'app-admin-rutinas',
  templateUrl: './rutinas.component.html',
  styleUrls: ['./rutinas.component.scss'],
})
export class RutinasComponent implements OnInit {

  tabActiva: Tab = 'todas';

  todas: SolicitudRutina[] = [];
  filtradas: SolicitudRutina[] = [];
  liberaciones: SolicitudRutina[] = [];

  filtro: FiltroEstado = 'todas';

  cargando = false;
  errorMensaje: string | null = null;

  // Modal rechazar liberación
  modalRechazoVisible = false;
  solicitudARechazar: SolicitudRutina | null = null;
  motivoRechazo = '';
  enviandoRechazo = false;
  errorRechazo: string | null = null;

  readonly filtros: { value: FiltroEstado; label: string }[] = [
    { value: 'todas',      label: 'Todas' },
    { value: 'pendiente',  label: 'Pendientes' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'resuelta',   label: 'Resueltas' },
    { value: 'rechazada',  label: 'Rechazadas' },
    { value: 'cancelada',  label: 'Canceladas' },
  ];

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'liberaciones') this.tabActiva = 'liberaciones';
    this.cargar();
  }

  get totalLiberaciones(): number {
    return this.liberaciones.length;
  }

  get totalSolicitudes(): number {
    return this.todas.length;
  }

  setTab(t: Tab): void { this.tabActiva = t; }

  setFiltro(f: FiltroEstado): void {
    this.filtro = f;
    this.aplicarFiltro();
  }

  reintentar(): void { this.cargar(); }
  trackById(_: number, s: SolicitudRutina): string { return s.id; }

  aprobarLiberacion(s: SolicitudRutina): void {
    this.adminService.aprobarLiberacion(s.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  abrirRechazo(s: SolicitudRutina): void {
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
      .rechazarLiberacion(this.solicitudARechazar.id, this.motivoRechazo.trim())
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

  private aplicarFiltro(): void {
    if (this.filtro === 'todas') {
      this.filtradas = this.todas;
      return;
    }
    this.filtradas = this.todas.filter(s => s.estado === this.filtro);
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.adminService
      .listarTodasSolicitudesRutina()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => {
          this.todas = data;
          this.aplicarFiltro();
          this.cargarLiberaciones();
        },
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar.';
          this.todas = [];
          this.filtradas = [];
        },
      });
  }

  private cargarLiberaciones(): void {
    this.adminService.listarLiberacionesPendientes().subscribe({
      next: (data) => (this.liberaciones = data),
      error: () => (this.liberaciones = []),
    });
  }
}