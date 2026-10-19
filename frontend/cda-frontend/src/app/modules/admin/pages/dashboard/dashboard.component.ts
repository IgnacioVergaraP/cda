import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdminService } from '../../services/admin.service';
import { DashboardUso, FiltroTipoRecurso, RANGOS, RangoAnalytics, RecursoUso } from '../../models/analytics.model';
import { TIPOS_RECURSO } from '../../../ejercicios/models/catalogo.model';

type VistaRanking = 'top' | 'bottom';

@Component({ selector: 'app-admin-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss'] })
export class DashboardComponent implements OnInit, OnDestroy {
  rango: RangoAnalytics = '30d';
  tipo: FiltroTipoRecurso = '';
  vista: VistaRanking = 'top';
  data: DashboardUso | null = null;
  cargando = false;
  errorMensaje: string | null = null;
  readonly rangos = RANGOS;
  readonly tipos = TIPOS_RECURSO;
  private carga?: Subscription;
  constructor(private adminService: AdminService) {}
  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.carga?.unsubscribe(); }
  setRango(rango: RangoAnalytics): void {
    if (this.rango !== rango) { this.rango = rango; this.cargar(); }
  }
  setTipo(tipo: FiltroTipoRecurso): void {
    if (this.tipo !== tipo) { this.tipo = tipo; this.cargar(); }
  }
  setVista(vista: VistaRanking): void { this.vista = vista; }
  reintentar(): void { this.cargar(); }
  get lista(): RecursoUso[] { return (this.vista === 'top' ? this.data?.top_usadas : this.data?.menos_usadas) ?? []; }
  get maximo(): number { return this.data?.top_usadas[0]?.cantidad_registros || 1; }
  get tituloVista(): string { return this.vista === 'top' ? 'Más utilizados' : 'Menos utilizados'; }
  private cargar(): void {
    this.carga?.unsubscribe();
    this.cargando = true; this.errorMensaje = null; this.data = null;
    this.carga = this.adminService.obtenerDashboardUso(this.rango, this.tipo)
      .pipe(finalize(() => (this.cargando = false))).subscribe({
        next: data => { this.data = data; },
        error: err => { this.errorMensaje = err?.error?.error?.message ?? 'No se pudo cargar el uso de recursos.'; },
      });
  }
}
