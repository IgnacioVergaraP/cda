import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { AuthService } from './modules/auth/services/auth.service';
import { GimnasioConfigService } from './core/services/gimnasio-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  readonly esAuth$: Observable<boolean>;
  mostrarBottomNav$: Observable<boolean>;
  mostrarSidebar$: Observable<boolean>;
  mostrarBannerProfesor$: Observable<boolean>;
  mostrarBannerAdmin$: Observable<boolean>;
  readonly gimnasioConfig$ = this.gimnasioConfig.config$;

  constructor(
    private auth: AuthService,
    private gimnasioConfig: GimnasioConfigService,
    private router: Router,
  ) {
    const navEnd$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
    );

    this.esAuth$ = navEnd$.pipe(map(() => this.router.url.startsWith('/auth')));

    this.mostrarBottomNav$ = combineLatest([navEnd$, this.auth.usuario$]).pipe(
      map(() => !this.router.url.startsWith('/auth')),
    );

    this.mostrarSidebar$ = combineLatest([navEnd$, this.auth.usuario$]).pipe(
      map(([_, usuario]) => {
        const url = this.router.url;
        const esAdmin = url.startsWith('/admin');
        const esGimnasio = usuario?.rol === 'gimnasio';
        const esPantallaGrande = window.innerWidth >= 1024;
        return esAdmin && esGimnasio && esPantallaGrande;
      }),
    );

    this.mostrarBannerAdmin$ = combineLatest([navEnd$, this.auth.usuario$]).pipe(
      map(([_, usuario]) => {
        const url = this.router.url;
        const enAdmin = url.startsWith('/admin');
        const esGimnasio = usuario?.rol === 'gimnasio';
        const sinSidebar = window.innerWidth < 1024;
        return enAdmin && esGimnasio && sinSidebar;
      }),
    );

    this.mostrarBannerProfesor$ = combineLatest([navEnd$, this.auth.usuario$]).pipe(
      map(([_, usuario]) => {
        const url = this.router.url;
        const enProfesor = url.startsWith('/profesor');
        const esGimnasio = usuario?.rol === 'gimnasio';
        return enProfesor && esGimnasio;
      }),
    );
  }

  get esDashboard(): boolean { return this.router.url.split(/[?#]/)[0] === '/admin/dashboard'; }

  irAModoProfesor(): void {
    this.router.navigate(['/profesor']);
  }

  irAModoAdmin(): void {
    this.router.navigate(['/admin']);
  }
}