import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../services/admin.service';
import {
  CrearMantenimientoPayload,
  Mantenimiento,
  MaquinaMantenimientosResponse,
  TIPOS_MANTENIMIENTO,
  TipoMantenimiento,
  etiquetaTipoMantenimiento,
} from '../../models/analytics.model';

@Component({
  selector: 'app-admin-maquina-detalle',
  templateUrl: './maquina-detalle.component.html',
  styleUrls: ['./maquina-detalle.component.scss'],
})
export class MaquinaDetalleComponent implements OnInit {

  maquinaId = '';
  data: MaquinaMantenimientosResponse | null = null;

  cargando = false;
  errorMensaje: string | null = null;

  // Sheet agregar mantenimiento
  sheetVisible = false;
  form: FormGroup;
  tipoSeleccionado: TipoMantenimiento = 'preventivo';
  guardando = false;
  errorSheet: string | null = null;

  // Modal eliminar
  modalEliminarVisible = false;
  mantenimientoAEliminar: Mantenimiento | null = null;
  eliminando = false;

  readonly tipos = TIPOS_MANTENIMIENTO;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      fecha: [this.hoyISO(), [Validators.required]],
      notas: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMensaje = 'Máquina no encontrada.';
      return;
    }
    this.maquinaId = id;
    this.cargar(this.route.snapshot.queryParamMap.get('registrar') === '1');
  }

  get puedeGuardar(): boolean {
    return !this.guardando && this.form.valid;
  }

  get fechaCtrl() { return this.form.get('fecha')!; }

  reintentar(): void { this.cargar(); }
  trackById(_: number, m: Mantenimiento): string { return m.id; }

  get etiquetaTipo(): typeof etiquetaTipoMantenimiento {
    return etiquetaTipoMantenimiento;
  }

  // -------- Sheet crear --------

  abrirSheet(): void {
    this.tipoSeleccionado = 'preventivo';
    this.form.reset({
      fecha: this.hoyISO(),
      notas: '',
    });
    this.errorSheet = null;
    this.sheetVisible = true;
  }

  cerrarSheet(): void {
    this.sheetVisible = false;
    setTimeout(() => {
      this.errorSheet = null;
    }, 250);
  }

  seleccionarTipo(t: TipoMantenimiento): void {
    this.tipoSeleccionado = t;
  }

  guardar(): void {
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorSheet = null;

    const payload: CrearMantenimientoPayload = {
      maquina_id: this.maquinaId,
      tipo: this.tipoSeleccionado,
      notas: this.form.value.notas?.trim() || null,
      fecha: this.form.value.fecha || null,
    };

    this.adminService
      .crearMantenimiento(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.cerrarSheet();
          this.cargar();
        },
        error: (err: any) => {
          this.errorSheet = err?.error?.error?.message ?? 'No se pudo crear.';
        },
      });
  }

  // -------- Eliminar --------

  confirmarEliminar(m: Mantenimiento): void {
    this.mantenimientoAEliminar = m;
    this.modalEliminarVisible = true;
  }

  cerrarEliminar(): void {
    this.modalEliminarVisible = false;
    setTimeout(() => (this.mantenimientoAEliminar = null), 200);
  }

  eliminar(): void {
    if (!this.mantenimientoAEliminar || this.eliminando) return;
    this.eliminando = true;

    this.adminService
      .eliminarMantenimiento(this.mantenimientoAEliminar.id)
      .pipe(finalize(() => (this.eliminando = false)))
      .subscribe({
        next: () => {
          this.cerrarEliminar();
          this.cargar();
        },
        error: () => {},
      });
  }

  // -------- Carga --------

  private cargar(abrirSheet = false): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.adminService
      .listarMantenimientosMaquina(this.maquinaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (d) => {
          this.data = d;
          if (abrirSheet) this.abrirSheet();
        },
        error: (err: any) => {
          this.errorMensaje = err?.error?.error?.message ?? 'No se pudo cargar la máquina.';
          this.data = null;
        },
      });
  }

  private hoyISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  get hoy(): string {
  return this.hoyISO();
}
}