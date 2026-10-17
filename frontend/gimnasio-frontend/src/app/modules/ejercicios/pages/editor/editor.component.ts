import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { CATEGORIAS, CategoriaEjercicio, Recurso, etiquetaRecurso } from '../../models/catalogo.model';
import { CatalogoService } from '../../services/catalogo.service';

@Component({ selector: 'app-catalogo-editor', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './editor.component.html', styleUrls: ['../../catalogo.scss'],
})
export class EditorComponent implements OnInit, OnDestroy {
  id: string | null = null;
  nombre = '';
  categoria: CategoriaEjercicio = 'maquina';
  descripcion = '';
  videoUrl = '';
  imagenUrl = '';
  gruposSeleccionados: string[] = [];
  seleccionados = new Map<string, Recurso>();
  recursos: Recurso[] = [];
  buscarRecurso = '';
  hayMasRecursos = false;
  cargando = false;
  cargandoRecursos = false;
  guardando = false;
  error: string | null = null;
  errorRecursos: string | null = null;
  errorGuardar: string | null = null;
  readonly categorias = CATEGORIAS;
  get grupos(): string[] { return [...new Set([...GRUPOS_MUSCULARES, ...this.gruposSeleccionados])]; }
  readonly etiquetaMusculo = etiquetaMusculo;
  readonly etiquetaRecurso = etiquetaRecurso;
  private detalle?: Subscription;
  private cargaRecursos?: Subscription;
  private escritura?: Subscription;
  constructor(private service: CatalogoService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.cargarRecursos();
    if (!this.id) return;
    this.cargando = true;
    this.detalle = this.service.obtener(this.id).pipe(finalize(() => (this.cargando = false))).subscribe({
      next: e => {
        this.nombre = e.nombre; this.categoria = e.categoria; this.descripcion = e.descripcion;
        this.videoUrl = e.video_url; this.imagenUrl = e.imagen_url; this.gruposSeleccionados = [...e.grupos_musculares];
        this.seleccionados = new Map(e.recursos.map(r => [r.id, r]));
      },
      error: err => { this.error = err?.error?.error?.message ?? 'No se pudo cargar el ejercicio.'; },
    });
  }
  ngOnDestroy(): void { this.detalle?.unsubscribe(); this.cargaRecursos?.unsubscribe(); this.escritura?.unsubscribe(); }
  get recursosSeleccionados(): Recurso[] { return [...this.seleccionados.values()]; }
  get puedeGuardar(): boolean { return !this.guardando && !this.cargando && !this.error && !!this.nombre.trim() && this.seleccionados.size > 0; }
  toggleGrupo(g: string): void {
    this.gruposSeleccionados = this.gruposSeleccionados.includes(g) ? this.gruposSeleccionados.filter(x => x !== g) : [...this.gruposSeleccionados, g];
  }
  toggleRecurso(r: Recurso): void {
    const seleccion = new Map(this.seleccionados);
    if (seleccion.has(r.id)) seleccion.delete(r.id);
    else if (seleccion.size < 30) seleccion.set(r.id, r);
    this.seleccionados = seleccion;
  }
  cargarRecursos(mas = false): void {
    this.cargaRecursos?.unsubscribe();
    if (!mas) this.recursos = [];
    this.cargandoRecursos = true; this.errorRecursos = null;
    this.cargaRecursos = this.service.recursos({ tipo: '', buscar: this.buscarRecurso.trim(), desde: mas ? this.recursos.length : 0 })
      .pipe(finalize(() => (this.cargandoRecursos = false))).subscribe({
        next: pagina => { this.recursos = [...this.recursos, ...pagina.items]; this.hayMasRecursos = pagina.hay_mas; },
        error: err => { this.errorRecursos = err?.error?.error?.message ?? 'No se pudieron cargar los recursos.'; },
      });
  }
  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true; this.errorGuardar = null;
    this.escritura = this.service.guardar({ nombre: this.nombre.trim(), categoria: this.categoria,
      grupos_musculares: this.gruposSeleccionados, descripcion: this.descripcion.trim(),
      video_url: this.videoUrl.trim(), imagen_url: this.imagenUrl.trim(), recurso_ids: [...this.seleccionados.keys()],
    }, this.id).pipe(finalize(() => (this.guardando = false))).subscribe({
      next: () => this.router.navigate(['/admin/catalogo']),
      error: err => { this.errorGuardar = err?.error?.error?.message ?? 'No se pudo guardar el ejercicio.'; },
    });
  }
}
