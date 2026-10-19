import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { Recurso, TipoRecurso, TIPOS_RECURSO, etiquetaRecurso } from '../../models/catalogo.model';
import { CatalogoService } from '../../services/catalogo.service';

@Component({ selector: 'app-catalogo-recursos', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './recursos.component.html', styleUrls: ['../../catalogo.scss'],
})
export class RecursosComponent implements OnInit, OnDestroy {
  recursos: Recurso[] = [];
  buscar = '';
  tipoFiltro = '';
  cargando = false;
  hayMas = false;
  error: string | null = null;
  sheetVisible = false;
  editandoId: string | null = null;
  nombre = '';
  tipo: TipoRecurso = 'maquina';
  numero = '';
  esCardio = false;
  descripcion = '';
  guardando = false;
  errorGuardar: string | null = null;
  readonly tipos = TIPOS_RECURSO;
  readonly etiquetaRecurso = etiquetaRecurso;
  private carga?: Subscription;
  private escritura?: Subscription;
  constructor(private service: CatalogoService) {}
  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.carga?.unsubscribe(); this.escritura?.unsubscribe(); }
  cargar(mas = false): void {
    this.carga?.unsubscribe();
    if (!mas) this.recursos = [];
    this.cargando = true; this.error = null;
    this.carga = this.service.recursos({ tipo: this.tipoFiltro, buscar: this.buscar.trim(), desde: mas ? this.recursos.length : 0 })
      .pipe(finalize(() => (this.cargando = false))).subscribe({
        next: pagina => { this.recursos = [...this.recursos, ...pagina.items]; this.hayMas = pagina.hay_mas; },
        error: err => { this.error = err?.error?.error?.message ?? 'No se pudieron cargar los recursos.'; },
      });
  }
  abrir(r?: Recurso): void {
    if (this.guardando) return;
    this.editandoId = r?.id ?? null; this.nombre = r?.nombre ?? ''; this.tipo = r?.tipo ?? 'maquina';
    this.esCardio = r?.es_cardio ?? false; this.numero = r?.numero_maquina ?? ''; this.descripcion = r?.descripcion ?? '';
    this.errorGuardar = null; this.sheetVisible = true;
  }
  cerrar(): void { if (!this.guardando) this.sheetVisible = false; }
  guardar(): void {
    if (this.guardando || !this.nombre.trim()) return;
    this.guardando = true; this.errorGuardar = null;
    this.escritura = this.service.guardarRecurso({ nombre: this.nombre.trim(), tipo: this.tipo,
      es_cardio: this.tipo === 'maquina' && this.esCardio, numero_maquina: this.numero.trim() || null, descripcion: this.descripcion.trim(),
    }, this.editandoId).pipe(finalize(() => (this.guardando = false))).subscribe({
      next: () => { this.sheetVisible = false; this.cargar(); },
      error: err => { this.errorGuardar = err?.error?.error?.message ?? 'No se pudo guardar el recurso.'; },
    });
  }
}
