import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiHttpService } from './api-http.service';
import { GimnasioConfig } from '../models/gimnasio-config.model';

const CSS_VAR_PRIMARY = '--color-primary';
const CSS_VAR_PRIMARY_HOVER = '--color-primary-hover';
const CSS_VAR_PRIMARY_SOFT = '--color-primary-soft';

@Injectable({
  providedIn: 'root',
})
export class GimnasioConfigService {

  private readonly _config$ = new BehaviorSubject<GimnasioConfig | null>(null);
  readonly config$ = this._config$.asObservable();

  constructor(private apiHttp: ApiHttpService) {}

  get config(): GimnasioConfig | null {
    return this._config$.value;
  }

  /** Carga la config del gimnasio del usuario y aplica el tema visual. */
  cargar(): Observable<GimnasioConfig> {
    return this.apiHttp.get<GimnasioConfig>('/gimnasio/config').pipe(
      tap(config => {
        this._config$.next(config);
        this.aplicarTema();
      }),
    );
  }

  limpiar(): void {
    this._config$.next(null);
    this.limpiarTema();
  }

  private aplicarTema(): void {
    const root = document.documentElement;
    // La identidad visual del template tiene prioridad sobre el color del gimnasio.
    const primary = '#FF6B00';
    root.style.setProperty(CSS_VAR_PRIMARY, primary);
    root.style.setProperty(CSS_VAR_PRIMARY_HOVER, '#202020');
    root.style.setProperty(CSS_VAR_PRIMARY_SOFT, this.lighten(primary, 0.9));
  }

  private limpiarTema(): void {
    const root = document.documentElement;
    root.style.removeProperty(CSS_VAR_PRIMARY);
    root.style.removeProperty(CSS_VAR_PRIMARY_HOVER);
    root.style.removeProperty(CSS_VAR_PRIMARY_SOFT);
  }

  /** Aclara un hex. factor 0..1 (0.9 = muy claro). */
  private lighten(hex: string, factor: number): string {
    return this.shift(hex, factor);
  }

  private shift(hex: string, factor: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);

    const target = factor >= 0 ? 255 : 0;
    const amount = Math.abs(factor);

    const nr = Math.round(r + (target - r) * amount);
    const ng = Math.round(g + (target - g) * amount);
    const nb = Math.round(b + (target - b) * amount);

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }

}