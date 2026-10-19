import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';

import { Maquina, etiquetaMusculo } from '../../models/maquina.model';
import { MaquinasService } from '../../services/maquinas.service';

@Component({
  selector: 'app-maquinas-detalle',
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss'],
})
export class DetalleComponent implements OnInit {

  maquina: Maquina | null = null;
  cargando = false;
  errorMensaje: string | null = null;

  videoUrlSeguro: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private maquinasService: MaquinasService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMensaje = 'Máquina no encontrada.';
      return;
    }
    this.cargar(id);
  }

  etiqueta(m: string): string {
    return etiquetaMusculo(m);
  }

  reintentar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(id);
  }

  private cargar(id: string): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.maquinasService
      .obtenerDetalle(id)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (m: Maquina) => {
          this.maquina = m;
          this.videoUrlSeguro = m.video_url
            ? this.sanitizer.bypassSecurityTrustResourceUrl(m.video_url)
            : null;
        },
        error: (err: any) => {
          this.errorMensaje =
            err?.error?.error?.message ?? 'No se pudo cargar la máquina.';
          this.maquina = null;
          this.videoUrlSeguro = null;
        },
      });
  }
}