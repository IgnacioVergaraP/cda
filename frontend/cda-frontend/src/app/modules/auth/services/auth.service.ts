import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { SupabaseService } from '../../../core/services/supabase.service';
import { User, UserRole } from '../../../shared/models/user.model';
import { ApiHttpService } from '../../../core/services/api-http.service';
import { GimnasioConfigService } from '../../../core/services/gimnasio-config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {

  // Estado reactivo de sesión
  private readonly _usuario$ = new BehaviorSubject<User | null>(null);
  readonly usuario$ = this._usuario$.asObservable();

  private readonly _inicializado$ = new BehaviorSubject<boolean>(false);
  readonly inicializado$ = this._inicializado$.asObservable();

  private readonly _session$ = new BehaviorSubject<Session | null>(null);
  readonly session$ = this._session$.asObservable();

  private readonly _authListener: { data: { subscription: { unsubscribe: () => void } } };

  constructor(
    private supabaseService: SupabaseService,
    private apiHttp: ApiHttpService,
    private gimnasioConfig: GimnasioConfigService,
    private router: Router,
  ) {
    // Escuchar cambios de sesión de Supabase
    const { data } = this.supabaseService.client.auth.onAuthStateChange(
      (event, session) => {
        this._session$.next(session);
        if (session?.access_token) {
          this.cargarPerfilDesdeBackend();
        } else {
          this._usuario$.next(null);
          this._inicializado$.next(true);
        }
      },
    );
    this._authListener = { data };

    // Bootstrap inicial: si hay sesión persistida, cargar perfil
    this.bootstrap();
  }

  ngOnDestroy(): void {
    this._authListener.data.subscription.unsubscribe();
  }

  // -------- Getters síncronos --------

  get usuarioActual(): User | null {
    return this._usuario$.value;
  }

  get estaLogueado(): boolean {
    return this._usuario$.value !== null;
  }

  get tieneToken(): boolean {
    return !!this._session$.value?.access_token;
  }

  tieneRol(...roles: UserRole[]): boolean {
    const u = this._usuario$.value;
    return !!u && roles.includes(u.rol);
  }

  get accessToken(): string | null {
    return this._session$.value?.access_token ?? null;
  }

  // -------- Acciones --------

  login(email: string, password: string): Observable<void> {
    return from(
      this.supabaseService.client.auth.signInWithPassword({ email, password }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (!data.session) throw new Error('No se obtuvo sesión.');
        // El listener de onAuthStateChange ya dispara cargarPerfilDesdeBackend
        // pero esperamos acá para devolver cuando esté listo.
        return this.cargarPerfilDesdeBackend();
      }),
      map(() => void 0),
    );
  }

  logout(redirect = true): void {
    from(this.supabaseService.client.auth.signOut()).subscribe({
      next: () => {
        this._usuario$.next(null);
        this._session$.next(null);
        this.gimnasioConfig.limpiar();
        if (redirect) this.router.navigate(['/auth']);
      },
      error: () => {
        this._usuario$.next(null);
        this._session$.next(null);
        this.gimnasioConfig.limpiar();
        if (redirect) this.router.navigate(['/auth']);
      },
    });
  }

  /**
   * Fuerza un refresco del perfil desde el backend.
   * Útil cuando se edita el perfil y queremos reflejar los cambios.
   */
  restaurarSesion(): Observable<User> {
    return this.cargarPerfilDesdeBackend().pipe(
      map(() => this._usuario$.value!),
    );
  }

  marcarInicializado(): void {
    this._inicializado$.next(true);
  }

  // -------- Helpers internos --------

  private bootstrap(): void {
    from(this.supabaseService.client.auth.getSession()).subscribe({
      next: ({ data }) => {
        this._session$.next(data.session);
        if (data.session?.access_token) {
          this.cargarPerfilDesdeBackend().subscribe({ error: () => {} });
        } else {
          this._inicializado$.next(true);
        }
      },
      error: () => {
        this._inicializado$.next(true);
      },
    });
  }

  private cargarPerfilDesdeBackend(): Observable<User> {
    return this.apiHttp.get<User>('/auth/me').pipe(
      tap({
        next: (user) => {
          this._usuario$.next(user);
          this._inicializado$.next(true);
          // Cargamos la config del gimnasio (logo, color, tabs)
          this.gimnasioConfig.cargar().subscribe({ error: () => {} });
        },
        error: () => {
          this._usuario$.next(null);
          this._inicializado$.next(true);
        },
      }),
    );
  }
}