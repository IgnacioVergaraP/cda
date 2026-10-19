import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MaquinasService } from '../../../maquinas/services/maquinas.service';
import { Maquina, etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { AdminService } from '../../services/admin.service';
import { Mantenimiento } from '../../models/analytics.model';

interface MaquinaConUltima {
  maquina: Maquina;
  ultimaMantenimiento: Mantenimiento | null;
}

@Component({
  selector: 'app-admin-maquinas-lista',
  templateUrl: './maquinas-lista.component.html',
  styleUrls: ['./maquinas-lista.component.scss'],
})
export class MaquinasListaComponent implements OnInit {

  items: MaquinaConUltima[] = [];
  filtrados: MaquinaConUltima[] = [];
  cargando = false;
  errorMensaje: string | null = null;

  busqueda = '';

  constructor(
    private maquinasService: MaquinasService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  reintentar(): void { this.cargar(); }
  etiqueta(m: string): string { return etiquetaMusculo(m); }

  onBusquedaChange(): void {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) {
      this.filtrados = this.items;
      return;
    }
    this.filtrados = this.items.filter(x =>
      x.maquina.nombre.toLowerCase().includes(q),
    );
  }

  irADetalle(m: Maquina): void {
    this.router.navigate(['/admin/maquinas', m.id]);
  }

  irARegistrar(m: Maquina): void {
    this.router.navigate(['/admin/maquinas', m.id], {
      queryParams: { registrar: '1' },
    });
  }

  getFechaUltima(m: Mantenimiento | null): string {
    if (!m) return 'Sin mantención';
    const d = new Date(m.fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `Última: ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  trackById(_: number, x: MaquinaConUltima): string {
    return x.maquina.id;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.maquinasService.listar().subscribe({
      next: (maquinas) => {
        // Cargamos todas las mantenciones y las agrupamos por máquina
        this.adminService.listarMantenimientos().subscribe({
          next: (mantenimientos) => {
            const porMaquina = new Map<string, Mantenimiento[]>();
            mantenimientos.forEach(m => {
              const arr = porMaquina.get(m.maquina_id) ?? [];
              arr.push(m);
              porMaquina.set(m.maquina_id, arr);
            });

            this.items = maquinas.map(m => {
              const arr = (porMaquina.get(m.id) ?? [])
                .sort((a, b) => b.fecha.localeCompare(a.fecha));
              return {
                maquina: m,
                ultimaMantenimiento: arr[0] ?? null,
              };
            });
            this.filtrados = this.items;
            this.cargando = false;
          },
          error: () => {
            this.items = maquinas.map(m => ({ maquina: m, ultimaMantenimiento: null }));
            this.filtrados = this.items;
            this.cargando = false;
          },
        });
      },
      error: (err: any) => {
        this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar las máquinas.';
        this.cargando = false;
      },
    });
  }
}