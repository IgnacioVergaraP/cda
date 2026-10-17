import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { filter, startWith, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../modules/auth/services/auth.service';
import { GimnasioConfigService } from '../../../core/services/gimnasio-config.service';
import { UserRole } from '../../../shared/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  gimnasioTab?: string;
  action?: 'mas';      // para diferenciar el tab "Más" que no navega
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent implements OnInit, OnDestroy {

  items: NavItem[] = [];

  // Sheet "Más"
  masVisible = false;

  private readonly destroy$ = new Subject<void>();

  private readonly navAlumno: NavItem[] = [
    { label: 'Ejercicios', icon: 'bi-grid',        route: '/ejercicios', gimnasioTab: 'maquinas' },
    { label: 'Rutina',   icon: 'bi-list-check',   route: '/rutinas', gimnasioTab: 'rutinas' },
    { label: 'Explorar', icon: 'bi-compass', route: '/explorar', gimnasioTab: 'rutinas' },
    { label: 'Progreso', icon: 'bi-graph-up',     route: '/progreso', gimnasioTab: 'progreso' },
    { label: 'Usuario',  icon: 'bi-person',       route: '/usuario', gimnasioTab: 'usuario' },
  ];

  private readonly navProfesor: NavItem[] = [
    { label: 'Inicio',   icon: 'bi-house',        route: '/profesor'          },
    { label: 'Alumnos',  icon: 'bi-people',       route: '/profesor/alumnos'  },
    { label: 'Rutinas',  icon: 'bi-list-check',   route: '/profesor/rutinas'  },
    { label: 'Subir',    icon: 'bi-plus-square',  route: '/profesor/subir'    },
    { label: 'Perfil',   icon: 'bi-person',       route: '/profesor/perfil'   },
  ];

  private readonly navAdmin: NavItem[] = [
    { label: 'Inicio',      icon: 'bi-house',      route: '/admin'             },
    { label: 'Solicitudes', icon: 'bi-inbox',      route: '/admin/solicitudes' },
    { label: 'Reportes',    icon: 'bi-flag',       route: '/admin/reportes'    },
    { label: 'Rutinas',     icon: 'bi-list-check', route: '/admin/rutinas'     },
    { label: 'Calendario',  icon: 'bi-calendar3',  route: '/admin/calendario'  },
    { label: 'Más',         icon: 'bi-three-dots', route: '',                  action: 'mas' },
  ];

  constructor(
    private auth: AuthService,
    private gimnasioConfig: GimnasioConfigService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const navEnd$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
    );

    combineLatest([navEnd$, this.auth.usuario$, this.gimnasioConfig.config$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, , config]) => this.actualizarItems(config?.tabs_habilitadas ?? []));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabClick(item: NavItem, ev: Event): void {
    if (item.action === 'mas') {
      ev.preventDefault();
      this.masVisible = true;
    }
  }

  cerrarMas(): void {
    this.masVisible = false;
  }

  irA(ruta: string): void {
    this.masVisible = false;
    setTimeout(() => this.router.navigate([ruta]), 150);
  }

  cerrarSesion(): void {
    this.masVisible = false;
    setTimeout(() => this.auth.logout(true), 150);
  }

  private actualizarItems(tabsHabilitadas: string[]): void {
    const rol: UserRole | null = this.auth.usuarioActual?.rol ?? null;
    const url = this.router.url;

    if (rol === 'gimnasio') {
      this.items = url.startsWith('/profesor') ? this.navProfesor : this.navAdmin;
    } else if (rol === 'profesor') {
      this.items = this.navProfesor;
    } else {
      this.items = tabsHabilitadas.length
        ? this.navAlumno.filter(item => !item.gimnasioTab || tabsHabilitadas.includes(item.gimnasioTab))
        : this.navAlumno;
    }
  }
}