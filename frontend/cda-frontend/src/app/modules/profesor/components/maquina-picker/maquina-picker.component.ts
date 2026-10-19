import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { Maquina, GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { MaquinasService } from '../../../maquinas/services/maquinas.service';

@Component({
  selector: 'app-maquina-picker',
  templateUrl: './maquina-picker.component.html',
  styleUrls: ['./maquina-picker.component.scss'],
})
export class MaquinaPickerComponent implements OnInit, OnChanges {

  @Input() maquinaSeleccionada: Maquina | null = null;
  @Output() maquinaChange = new EventEmitter<Maquina | null>();

  maquinas: Maquina[] = [];
  filtradas: Maquina[] = [];
  cargando = false;

  busqueda = '';
  filtroMusculo: string | null = null;

  readonly grupos = GRUPOS_MUSCULARES;

  constructor(private maquinasService: MaquinasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(_: SimpleChanges): void {
    // si cambia la selección desde afuera, nada especial por ahora
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroChange(m: string | null): void {
    this.filtroMusculo = m;
    this.aplicarFiltros();
  }

  seleccionar(m: Maquina): void {
    this.maquinaChange.emit(m);
  }

  quitar(): void {
    this.maquinaChange.emit(null);
  }

  private cargar(): void {
    this.cargando = true;
    this.maquinasService
      .listar()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: Maquina[]) => {
          this.maquinas = data;
          this.aplicarFiltros();
        },
        error: () => {
          this.maquinas = [];
          this.filtradas = [];
        },
      });
  }

  private aplicarFiltros(): void {
    let res = this.maquinas;

    if (this.filtroMusculo) {
      res = res.filter(m =>
        m.grupos_musculares.some(g => g.toLowerCase() === this.filtroMusculo!.toLowerCase()),
      );
    }

    const q = this.busqueda.trim().toLowerCase();
    if (q) {
      res = res.filter(m => m.nombre.toLowerCase().includes(q));
    }

    this.filtradas = res.slice(0, 10);
  }
}