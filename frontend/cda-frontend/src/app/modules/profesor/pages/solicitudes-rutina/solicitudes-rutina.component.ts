import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { ProfesorService } from '../../services/profesor.service';
import { SolicitudRutina } from '../../models/solicitud-rutina.model';

type FiltroEstado = 'disponibles' | 'tomadas' | 'todas';

@Component({
  selector: 'app-profesor-solicitudes-rutina',
  templateUrl: './solicitudes-rutina.component.html',
  styleUrls: ['./solicitudes-rutina.component.scss'],
})
export class SolicitudesRutinaComponent implements OnInit {

  filtro: FiltroEstado = 'disponibles';

  disponibles: SolicitudRutina[] = [];
  tomadas: SolicitudRutina[] = [];

  cargando = false;
  errorMensaje: string | null = null;

  // Modal simple para resolver/rechazar/soltar
  modalVisible = false;
  modalTipo: 'resolver' | 'rechazar' | null = null;
  solicitudEnModal: SolicitudRutina | null = null;
  textoModal = '';
  enviandoModal = false;
  errorModal: string | null = null;

  constructor(private profesorService: ProfesorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get listaActual(): SolicitudRutina[] {
    if (this.filtro === 'disponibles') return this.disponibles;
    if (this.filtro === 'tomadas') return this.tomadas;
    return [...this.disponibles, ...this.tomadas];
  }

  reintentar(): void {
    this.cargar();
  }

  trackById(_: number, s: SolicitudRutina): string {
    return s.id;
  }

  // -------- Acciones --------

  tomar(s: SolicitudRutina): void {
    this.profesorService.tomarSolicitudRutina(s.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  abrirModalResolver(s: SolicitudRutina): void {
    this.modalTipo = 'resolver';
    this.solicitudEnModal = s;
    this.textoModal = '';
    this.errorModal = null;
    this.modalVisible = true;
  }

  abrirModalRechazar(s: SolicitudRutina): void {
    this.modalTipo = 'rechazar';
    this.solicitudEnModal = s;
    this.textoModal = '';
    this.errorModal = null;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    setTimeout(() => {
      this.solicitudEnModal = null;
      this.textoModal = '';
      this.errorModal = null;
    }, 200);
  }

  confirmarModal(): void {
    if (!this.solicitudEnModal || !this.modalTipo) return;
    if (!this.textoModal.trim() || this.textoModal.trim().length < 5) {
      this.errorModal = 'Escribí al menos 5 caracteres.';
      return;
    }

    this.enviandoModal = true;
    this.errorModal = null;

    const obs$ = this.modalTipo === 'resolver'
      ? this.profesorService.resolverSolicitudRutina(this.solicitudEnModal.id, this.textoModal.trim(), null)
      : this.profesorService.rechazarSolicitudRutina(this.solicitudEnModal.id, this.textoModal.trim());

    obs$.pipe(finalize(() => (this.enviandoModal = false))).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
      },
      error: (err: any) => {
        this.errorModal = err?.error?.error?.message ?? 'No se pudo enviar.';
      },
    });
  }

  solicitarLiberacion(s: SolicitudRutina): void {
    this.profesorService.solicitarLiberacion(s.id).subscribe({
      next: () => this.cargar(),
      error: () => {},
    });
  }

  get tituloModal(): string {
    return this.modalTipo === 'resolver' ? 'Resolver solicitud' : 'Rechazar solicitud';
  }

  get placeholderModal(): string {
    return this.modalTipo === 'resolver'
      ? 'Ej: Quedamos el jueves 19hs en recepción para armarla juntos.'
      : 'Motivo del rechazo...';
  }

  // -------- Carga --------

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.profesorService.listarSolicitudesRutinaDisponibles().subscribe({
      next: (data) => {
        this.disponibles = data;
        this.cargarTomadas();
      },
      error: (err: any) => {
        this.errorMensaje = err?.error?.error?.message ?? 'No se pudieron cargar las solicitudes.';
        this.cargando = false;
      },
    });
  }

  private cargarTomadas(): void {
    this.profesorService
      .listarSolicitudesRutinaTomadas()
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (data) => (this.tomadas = data),
        error: () => (this.tomadas = []),
      });
  }
}