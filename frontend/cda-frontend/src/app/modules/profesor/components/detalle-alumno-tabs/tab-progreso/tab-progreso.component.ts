import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { ProfesorService, ProgresoAlumnoResponse } from '../../../services/profesor.service';
import { HistorialFila } from '../../../../progreso/models/progreso.model';
import { User } from '../../../../../shared/models/user.model';

@Component({
  selector: 'app-tab-progreso',
  templateUrl: './tab-progreso.component.html',
  styleUrls: ['./tab-progreso.component.scss'],
})
export class TabProgresoComponent implements OnInit, OnChanges {

  @Input() alumno!: User;

  historial: HistorialFila[] = [];
  evolucion: any = null;

  cargando = false;
  errorMensaje: string | null = null;

  constructor(private profesorService: ProfesorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.alumno?.id) this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  verEvolucion(fila: HistorialFila): void {
    const key = fila.ejercicio_tipo === 'maquina'
      ? (fila.maquina_id ?? '')
      : (fila.nombre_libre ?? '');
    if (key) this.cargarEvolucion(key);
  }

  get ejercicioDestacado(): string {
    return this.evolucion?.ejercicio ?? '';
  }

  trackByHistorial(_: number, f: HistorialFila): string {
    return `${f.maquina_id ?? f.nombre_libre}-${f.fecha}`;
  }

  private cargar(): void {
    if (!this.alumno?.id) return;

    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService
      .obtenerProgresoAlumno(this.alumno.id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data: ProgresoAlumnoResponse) => {
          this.historial = data.historial;
          this.evolucion = data.evolucion;
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar el progreso.';
          this.historial = [];
          this.evolucion = null;
        },
      });
  }

  private cargarEvolucion(ejercicio: string): void {
    // Usamos el mismo endpoint de evolución pero de forma aislada
    // (el backend expone uno general en /api/progreso/evolucion
    //  pero desde el profesor accedemos a través del progreso del alumno)
    // Por ahora solo recargamos todo — el ejercicio destacado ya viene del backend.
    this.cargar();
  }
}