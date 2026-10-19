import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import { EstadoReporte, Reporte } from '../../../profesor/models/reporte.model';

type FiltroEstado = 'todos' | 'abierto' | 'en_revision' | 'resuelto';

@Component({
  selector: 'app-admin-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit {

  reportes: Reporte[] = [];
  filtrados: Reporte[] = [];
  filtro: FiltroEstado = 'abierto';

  cargando = false;
  errorMensaje: string | null = null;

  // Modal resolver
  modalResolverVisible = false;
  reporteAResolver: Reporte | null = null;
  resolucion = '';
  resolviendo = false;
  errorResolver: string | null = null;

  readonly filtros: { value: FiltroEstado; label: string }[] = [
    { value: 'abierto',     label: 'Abiertos' },
    { value: 'en_revision', label: 'En revisión' },
    { value: 'resuelto',    label: 'Resueltos' },
    { value: 'todos',       label: 'Todos' },
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.cargar(); }

  reintentar(): void { this.cargar(); }
  trackById(_: number, r: Reporte): string { return r.id; }

  setFiltro(f: FiltroEstado): void {
    this.filtro = f;
    this.aplicarFiltro();
  }

  marcarEnRevision(r: Reporte): void {
    this.adminService.marcarReporteEnRevision(r.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  abrirResolver(r: Reporte): void {
    this.reporteAResolver = r;
    this.resolucion = '';
    this.errorResolver = null;
    this.modalResolverVisible = true;
  }

  cerrarResolver(): void {
    this.modalResolverVisible = false;
    setTimeout(() => {
      this.reporteAResolver = null;
      this.resolucion = '';
      this.errorResolver = null;
    }, 200);
  }

  confirmarResolver(): void {
    if (!this.reporteAResolver || this.resolviendo) return;
    this.resolviendo = true;
    this.errorResolver = null;

    const res = this.resolucion.trim() || null;

    this.adminService
      .resolverReporte(this.reporteAResolver.id, res)
      .pipe(finalize(() => (this.resolviendo = false)))
      .subscribe({
        next: () => {
          this.cerrarResolver();
          this.cargar();
        },
        error: (err: any) => {
          this.errorResolver = err?.error?.error?.message ?? 'No se pudo resolver.';
        },
      });
  }

  private aplicarFiltro(): void {
    if (this.filtro === 'todos') {
      this.filtrados = this.reportes;
      return;
    }
    this.filtrados = this.reportes.filter(r => r.estado === this.filtro);
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.adminService
      .listarTodosReportes()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => {
          this.reportes = data;
          this.aplicarFiltro();
        },
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar.';
          this.reportes = [];
          this.filtrados = [];
        },
      });
  }
}