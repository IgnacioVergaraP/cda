import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth.service';
import { ActualizarPerfilPayload, User } from '../../../../shared/models/user.model';
import { UsuarioResumen } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {

  usuario: User | null = null;
  resumen: UsuarioResumen | null = null;

  cargando = true;
  errorMensaje: string | null = null;

  edicionVisible = false;
  form: FormGroup;
  guardandoEdicion = false;
  errorEdicion: string | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      altura: [null as number | null, [Validators.min(50), Validators.max(250)]],
      peso_actual: [null as number | null, [Validators.min(20), Validators.max(300)]],
      peso_objetivo: [null as number | null, [Validators.min(20), Validators.max(300)]],
      porcentaje_grasa: [null as number | null, [Validators.min(3), Validators.max(70)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get nombreCtrl() { return this.form.get('nombre')!; }
  get alturaCtrl() { return this.form.get('altura')!; }
  get pesoCtrl() { return this.form.get('peso_actual')!; }
  get pesoObjetivoCtrl() { return this.form.get('peso_objetivo')!; }
  get grasaCtrl() { return this.form.get('porcentaje_grasa')!; }

  reintentar(): void {
    this.cargar();
  }

  abrirEdicion(): void {
    if (!this.usuario) return;

    this.form.patchValue({
      nombre: this.usuario.nombre,
      altura: this.usuario.altura,
      peso_actual: this.usuario.peso_actual,
      peso_objetivo: this.usuario.peso_objetivo,
      porcentaje_grasa: this.usuario.porcentaje_grasa,
    });
    this.errorEdicion = null;
    this.edicionVisible = true;
  }

  cerrarEdicion(): void {
    this.edicionVisible = false;
    setTimeout(() => {
      this.errorEdicion = null;
      this.form.reset();
    }, 250);
  }

  guardarEdicion(): void {
    if (this.form.invalid || this.guardandoEdicion) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardandoEdicion = true;
    this.errorEdicion = null;

    const raw = this.form.value;
    const payload: ActualizarPerfilPayload = {
      nombre: raw.nombre?.trim(),
      altura: raw.altura != null ? Number(raw.altura) : null,
      peso_actual: raw.peso_actual != null ? Number(raw.peso_actual) : null,
      peso_objetivo: raw.peso_objetivo != null ? Number(raw.peso_objetivo) : null,
      porcentaje_grasa: raw.porcentaje_grasa != null ? Number(raw.porcentaje_grasa) : null,
    };

    this.usuarioService
      .actualizarPerfil(payload)
      .pipe(finalize(() => (this.guardandoEdicion = false)))
      .subscribe({
        next: (user: User) => {
          this.usuario = user;
          this.refrescarUsuarioEnAuth();
          this.cerrarEdicion();
        },
        error: (err: any) => {
          this.errorEdicion =
            err?.error?.error?.message ?? 'No se pudo guardar el perfil.';
        },
      });
  }

  cerrarSesion(): void {
    this.auth.logout(true);
  }

  // ----- Getters de presentación -----

  get imcTexto(): string {
    return this.usuario?.imc != null ? this.usuario.imc.toFixed(1) : '—';
  }

  get tieneImc(): boolean {
    return this.usuario?.imc != null;
  }

  get grasaTexto(): string {
    return this.usuario?.porcentaje_grasa != null
      ? `${this.usuario.porcentaje_grasa}%`
      : '—';
  }

  get tieneGrasa(): boolean {
    return this.usuario?.porcentaje_grasa != null;
  }

  get grasaDetalle(): string {
    if (!this.usuario?.porcentaje_grasa) return 'Pendiente de medición';
    const origen = this.usuario.origen_grasa === 'profesor'
      ? 'Medido por profesor'
      : 'Auto-reportado';
    const fecha = this.usuario.fecha_medicion_grasa
      ? ` · ${this.formatearFechaCorta(this.usuario.fecha_medicion_grasa)}`
      : '';
    return `${origen}${fecha}`;
  }

  get faltanKg(): number | null {
    if (!this.usuario?.peso_actual || !this.usuario?.peso_objetivo) return null;
    return Math.round((this.usuario.peso_actual - this.usuario.peso_objetivo) * 10) / 10;
  }

  get tieneObjetivo(): boolean {
    return this.usuario?.peso_objetivo != null;
  }

  get textoObjetivo(): string {
    if (!this.tieneObjetivo) return '';
    const dif = this.faltanKg;
    if (dif == null) return `Objetivo: ${this.usuario!.peso_objetivo} kg`;
    if (dif > 0) return `Faltan ${dif} kg para tu objetivo de ${this.usuario!.peso_objetivo} kg`;
    if (dif < 0) return `Superaste tu objetivo por ${Math.abs(dif)} kg`;
    return '¡Estás en tu peso objetivo!';
  }

  get miembroDesde(): string {
    if (!this.usuario?.fecha_alta) return '—';
    return this.formatearFechaMes(this.usuario.fecha_alta);
  }

  private formatearFechaCorta(iso: string): string {
    const d = new Date(iso);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]}`;
  }

  private formatearFechaMes(iso: string): string {
    const d = new Date(iso);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    let perfilOk = false;
    let resumenOk = false;

    this.usuarioService.obtenerPerfil().subscribe({
      next: (u: User) => {
        this.usuario = u;
        perfilOk = true;
        if (perfilOk && resumenOk) this.cargando = false;
      },
      error: (err: any) => {
        this.errorMensaje =
          err?.error?.error?.message ?? 'No se pudo cargar el perfil.';
        this.cargando = false;
      },
    });

    this.usuarioService.obtenerResumen().subscribe({
      next: (r: UsuarioResumen) => {
        this.resumen = r;
        resumenOk = true;
        if (perfilOk && resumenOk) this.cargando = false;
      },
      error: () => {
        this.resumen = null;
        resumenOk = true;
        if (perfilOk && resumenOk) this.cargando = false;
      },
    });
  }

  private refrescarUsuarioEnAuth(): void {
    this.auth.restaurarSesion().subscribe({ error: () => {} });
  }
}