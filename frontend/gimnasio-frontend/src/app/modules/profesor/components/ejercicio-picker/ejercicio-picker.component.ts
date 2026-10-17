import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { CATEGORIAS, EjercicioCatalogo, etiquetaCategoria } from '../../../ejercicios/models/catalogo.model';
import { CatalogoService } from '../../../ejercicios/services/catalogo.service';
import { GRUPOS_MUSCULARES, etiquetaMusculo } from '../../../maquinas/models/maquina.model';

@Component({
  selector: 'app-ejercicio-picker', standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './ejercicio-picker.component.html',
  styleUrls: ['../maquina-picker/maquina-picker.component.scss'],
})
export class EjercicioPickerComponent implements OnInit, OnDestroy {
  @Input() seleccionado: EjercicioCatalogo | null = null;
  @Output() seleccionChange = new EventEmitter<EjercicioCatalogo | null>();
  ejercicios: EjercicioCatalogo[] = [];
  @Input() categoria = '';
  @Output() categoriaChange = new EventEmitter<string>();
  cambiarCategoria(categoria: string): void { this.categoria = categoria; this.categoriaChange.emit(categoria); this.cargar(); }
  musculo = '';
  buscar = '';
  cargando = false;
  hayMas = false;
  error: string | null = null;
  readonly categorias = CATEGORIAS;
  readonly grupos = GRUPOS_MUSCULARES;
  readonly etiquetaCategoria = etiquetaCategoria;
  readonly etiquetaMusculo = etiquetaMusculo;
  private carga?: Subscription;
  constructor(private service: CatalogoService) {}
  ngOnInit(): void { if (!this.seleccionado) this.cargar(); }
  ngOnDestroy(): void { this.carga?.unsubscribe(); }
  quitar(): void { this.seleccionChange.emit(null); this.cargar(); }
  cargar(mas = false): void {
    this.carga?.unsubscribe();
    if (!mas) this.ejercicios = [];
    this.cargando = true;
    this.error = null;
    this.carga = this.service.listar({ categoria: this.categoria, musculo: this.musculo,
      buscar: this.buscar.trim(), desde: mas ? this.ejercicios.length : 0 })
      .pipe(finalize(() => (this.cargando = false))).subscribe({
        next: pagina => { this.ejercicios = [...this.ejercicios, ...pagina.items]; this.hayMas = pagina.hay_mas; },
        error: () => { this.error = 'No pudimos cargar los ejercicios.'; },
      });
  }
}
