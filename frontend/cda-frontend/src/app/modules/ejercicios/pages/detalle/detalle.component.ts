import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../auth/services/auth.service';
import { etiquetaMusculo } from '../../../maquinas/models/maquina.model';
import { EjercicioCatalogo, etiquetaCategoria, etiquetaRecurso } from '../../models/catalogo.model';
import { CatalogoService } from '../../services/catalogo.service';

@Component({ selector: 'app-ejercicio-detalle', standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './detalle.component.html', styleUrls: ['../../catalogo.scss'],
})
export class DetalleComponent implements OnInit, OnDestroy {
  ejercicio: EjercicioCatalogo | null = null;
  cargando = false;
  error: string | null = null;
  video: SafeResourceUrl | null = null;
  readonly etiquetaCategoria = etiquetaCategoria;
  readonly etiquetaRecurso = etiquetaRecurso;
  readonly etiquetaMusculo = etiquetaMusculo;
  private carga?: Subscription;
  constructor(private service: CatalogoService, private route: ActivatedRoute, private sanitizer: DomSanitizer, public auth: AuthService) {}
  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.carga?.unsubscribe(); }
  cargar(): void {
    this.carga?.unsubscribe();
    this.cargando = true; this.error = null; this.ejercicio = null; this.video = null;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.cargando = false; this.error = 'Ejercicio no encontrado.'; return; }
    this.carga = this.service.obtener(id).pipe(finalize(() => (this.cargando = false))).subscribe({
      next: ejercicio => {
        this.ejercicio = ejercicio;
        // Solo se incrustan videos de los proveedores admitidos, incluidos los datos migrados.
        try {
          const url = new URL(ejercicio.video_url);
          if (url.protocol === 'https:' && ['www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname) && url.pathname.startsWith('/embed/')) {
            this.video = this.sanitizer.bypassSecurityTrustResourceUrl(url.href);
          }
        } catch { this.video = null; }
      },
      error: err => { this.error = err?.error?.error?.message ?? 'No se pudo cargar el ejercicio.'; },
    });
  }
}
