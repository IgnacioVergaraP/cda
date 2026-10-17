import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { Rutina } from '../../../rutinas/models/rutina.model';
import { DISCIPLINAS, NIVELES, etiquetaDisciplina, etiquetaNivel } from '../../../rutinas/models/publicacion.model';
import { RutinasService } from '../../../rutinas/services/rutinas.service';

@Component({
  selector: 'app-catalogo-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class CatalogoComponent implements OnInit, OnDestroy {
  gestion = false;
  rutinas: Rutina[] = [];
  buscar = '';
  disciplina = '';
  nivel = '';
  hayMas = false;
  cargando = false;
  error: string | null = null;
  errorAccion: string | null = null;
  cambiandoId: string | null = null;
  readonly disciplinas = DISCIPLINAS;
  readonly niveles = NIVELES;
  readonly etiquetaDisciplina = etiquetaDisciplina;
  readonly etiquetaNivel = etiquetaNivel;
  private carga?: Subscription;
  private accion?: Subscription;

  constructor(private route: ActivatedRoute, private service: RutinasService) {}

  ngOnInit(): void {
    this.gestion = this.route.snapshot.data['gestion'] === true;
    this.cargar();
  }

  ngOnDestroy(): void { this.carga?.unsubscribe(); this.accion?.unsubscribe(); }

  cargar(mas = false): void {
    this.carga?.unsubscribe();
    if (!mas) this.rutinas = [];
    this.error = null;
    this.cargando = true;
    this.carga = this.service.listarPublicas({
      buscar: this.buscar.trim(), disciplina: this.disciplina, nivel: this.nivel,
      desde: mas ? this.rutinas.length : 0,
    }, this.gestion).pipe(finalize(() => (this.cargando = false))).subscribe({
      next: pagina => {
        this.rutinas = mas ? [...this.rutinas, ...pagina.items] : pagina.items;
        this.hayMas = pagina.hay_mas;
      },
      error: err => { this.error = err?.error?.error?.message ?? 'No se pudieron cargar las rutinas.'; },
    });
  }

  cambiarPublicacion(rutina: Rutina): void {
    if (this.cambiandoId) return;
    this.errorAccion = null;
    this.cambiandoId = rutina.id;
    this.accion = this.service.cambiarPublicacion(rutina.id, !rutina.activa)
      .pipe(finalize(() => (this.cambiandoId = null))).subscribe({
        next: actualizada => {
          this.rutinas = this.rutinas.map(r => r.id === actualizada.id ? actualizada : r);
        },
        error: err => { this.errorAccion = err?.error?.error?.message ?? 'No se pudo cambiar la publicación.'; },
      });
  }

  rutaDetalle(rutina: Rutina): string[] {
    return this.gestion ? ['/profesor/publicaciones', rutina.id, 'ver'] : ['/explorar', rutina.id];
  }

  trackById(_: number, rutina: Rutina): string { return rutina.id; }
}
