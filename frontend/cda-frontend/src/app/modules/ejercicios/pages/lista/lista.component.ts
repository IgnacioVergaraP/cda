import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { CATEGORIAS, EjercicioCatalogo, Recurso, etiquetaCategoria, etiquetaRecurso } from '../../models/catalogo.model';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-ejercicios-lista', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './lista.component.html', styleUrls: ['../../catalogo.scss'],
})
export class ListaComponent implements OnInit, OnDestroy {
  gestion = false;
  ejercicios: EjercicioCatalogo[] = [];
  categoria = '';
  musculo = '';
  buscar = '';
  cargando = false;
  hayMas = false;
  error: string | null = null;
  readonly categorias = CATEGORIAS;
  readonly grupos = GRUPOS_MUSCULARES;
  readonly etiquetaMusculo = etiquetaMusculo;
  readonly etiquetaCategoria = etiquetaCategoria;
  readonly etiquetaRecurso = etiquetaRecurso;
  private carga?: Subscription;
  constructor(private service: CatalogoService, private route: ActivatedRoute) {}
  ngOnInit(): void { this.gestion = this.route.snapshot.data['gestion'] === true; this.cargar(); }
  ngOnDestroy(): void { this.carga?.unsubscribe(); }
  setCategoria(categoria: string): void { this.categoria = categoria; this.cargar(); }
  cargar(mas = false): void {
    this.carga?.unsubscribe();
    if (!mas) this.ejercicios = [];
    this.cargando = true;
    this.error = null;
    this.carga = this.service.listar({ categoria: this.categoria, musculo: this.musculo, buscar: this.buscar.trim(), desde: mas ? this.ejercicios.length : 0 })
      .pipe(finalize(() => (this.cargando = false))).subscribe({
        next: pagina => { this.ejercicios = [...this.ejercicios, ...pagina.items]; this.hayMas = pagina.hay_mas; },
        error: err => { this.error = err?.error?.error?.message ?? 'No se pudo cargar el catálogo de ejercicios.'; },
      });
  }
  trackById(_: number, ejercicio: EjercicioCatalogo): string { return ejercicio.id; }
  repiteNombre(recurso: Recurso, ejercicio: EjercicioCatalogo): boolean {
    return recurso.nombre.trim().toLocaleLowerCase('es') === ejercicio.nombre.trim().toLocaleLowerCase('es');
  }
}
