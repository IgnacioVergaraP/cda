import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EjercicioCatalogo } from '../../../ejercicios/models/catalogo.model';

@Component({ selector: 'app-progreso-seleccionar-ejercicio', templateUrl: './seleccionar-ejercicio.component.html', styleUrls: ['./seleccionar-ejercicio.component.scss'] })
export class SeleccionarEjercicioComponent {
  nombreLibre = '';
  constructor(private router: Router) {}
  elegirEjercicio(e: EjercicioCatalogo | null): void {
    if (e) this.router.navigate(['/progreso/registrar'], { queryParams: { ejercicio_catalogo_id: e.id } });
  }
  confirmarLibre(): void {
    const nombre = this.nombreLibre.trim();
    if (nombre && nombre.length <= 100) this.router.navigate(['/progreso/registrar'], { queryParams: { tipo: 'libre', nombre } });
  }
}
