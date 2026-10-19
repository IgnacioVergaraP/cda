import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { Maquina } from '../../models/maquina.model';
import { MaquinasService } from '../../services/maquinas.service';

@Component({
  selector: 'app-maquinas-lista',
  templateUrl: './lista.component.html',
  styleUrls: ['./lista.component.scss'],
})
export class ListaComponent implements OnInit {

  maquinas: Maquina[] = [];
  cargando = false;
  errorMensaje: string | null = null;
  musculoSeleccionado: string | null = null;
  busqueda = '';

  constructor(private maquinasService: MaquinasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  onMusculoChange(musculo: string | null): void {
    this.musculoSeleccionado = musculo;
    this.cargar();
  }

  onBusquedaChange(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
  }

  get maquinasFiltradas(): Maquina[] {
    const query = this.normalizar(this.busqueda);
    if (!query) return this.maquinas;

    return this.maquinas.filter(maquina =>
      this.normalizar([
        maquina.nombre,
        maquina.descripcion,
        ...maquina.grupos_musculares,
      ].join(' ')).includes(query),
    );
  }

  reintentar(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    const peticion$ = this.musculoSeleccionado
      ? this.maquinasService.listarPorMusculo(this.musculoSeleccionado)
      : this.maquinasService.listar();

    peticion$
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Maquina[]) => (this.maquinas = data),
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudieron cargar las máquinas.';
          this.maquinas = [];
        },
      });
  }

  trackById(_: number, m: Maquina): string {
    return m.id;
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}