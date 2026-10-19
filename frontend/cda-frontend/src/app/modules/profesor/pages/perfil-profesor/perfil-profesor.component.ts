import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth.service';
import { ActualizarPerfilPayload, User } from '../../../../shared/models/user.model';
import { UsuarioService } from '../../../usuario/services/usuario.service';

@Component({
  selector: 'app-profesor-perfil',
  templateUrl: './perfil-profesor.component.html',
  styleUrls: ['./perfil-profesor.component.scss'],
})
export class PerfilProfesorComponent implements OnInit {

  usuario: User | null = null;
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
      bio: ['', [Validators.maxLength(500)]],
      especialidades: [''],
      anios_experiencia: [null as number | null, [Validators.min(0), Validators.max(60)]],
      telefono: ['', [Validators.maxLength(20)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get nombreCtrl() { return this.form.get('nombre')!; }
  get bioCtrl() { return this.form.get('bio')!; }
  get aniosCtrl() { return this.form.get('anios_experiencia')!; }
  get telefonoCtrl() { return this.form.get('telefono')!; }

  get especialidadesTexto(): string {
    const esp = this.usuario?.especialidades;
    if (!esp || esp.length === 0) return '—';
    return esp.join(' · ');
  }

  get aniosTexto(): string {
    const a = this.usuario?.anios_experiencia;
    if (a == null) return '—';
    return `${a} año${a === 1 ? '' : 's'}`;
  }

  reintentar(): void {
    this.cargar();
  }

  abrirEdicion(): void {
    if (!this.usuario) return;

    this.form.patchValue({
      nombre: this.usuario.nombre,
      bio: this.usuario.bio ?? '',
      especialidades: (this.usuario.especialidades ?? []).join(', '),
      anios_experiencia: this.usuario.anios_experiencia,
      telefono: this.usuario.telefono ?? '',
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

    // Parseo de especialidades: "musculación, fuerza" → ['musculación', 'fuerza']
    const espRaw = (raw.especialidades ?? '')
      .split(',')
      .map((s: string) => s.trim().toLowerCase())
      .filter((s: string) => s.length > 0);

    const payload: ActualizarPerfilPayload = {
      nombre: raw.nombre?.trim(),
      bio: raw.bio?.trim() || null,
      especialidades: espRaw.length > 0 ? espRaw : null,
      anios_experiencia: raw.anios_experiencia != null ? Number(raw.anios_experiencia) : null,
      telefono: raw.telefono?.trim() || null,
    };

    this.usuarioService
      .actualizarPerfil(payload)
      .pipe(finalize(() => (this.guardandoEdicion = false)))
      .subscribe({
        next: (user: User) => {
          this.usuario = user;
          this.auth.restaurarSesion().subscribe({ error: () => {} });
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

  get miembroDesde(): string {
    if (!this.usuario?.fecha_alta) return '—';
    const d = new Date(this.usuario.fecha_alta);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private cargar(): void {
    this.cargando = true;
    this.errorMensaje = null;

    this.usuarioService.obtenerPerfil().subscribe({
      next: (u: User) => {
        this.usuario = u;
        this.cargando = false;
      },
      error: (err: any) => {
        this.errorMensaje =
          err?.error?.error?.message ?? 'No se pudo cargar el perfil.';
        this.cargando = false;
      },
    });
  }
}