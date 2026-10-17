import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../modules/auth/services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent implements OnInit, OnDestroy {

  nombre = '';
  iniciales = '';

  readonly items: SidebarItem[] = [
    { label: 'Inicio',        icon: 'bi-house',           route: '/admin'             },
    { label: 'Dashboard',     icon: 'bi-bar-chart',       route: '/admin/dashboard'   },
    { label: 'Ejercicios', icon: 'bi-collection', route: '/admin/catalogo' },
    { label: 'Mantenciones',  icon: 'bi-tools',           route: '/admin/maquinas'    },
    { label: 'Solicitudes',   icon: 'bi-inbox',           route: '/admin/solicitudes' },
    { label: 'Reportes',      icon: 'bi-flag',            route: '/admin/reportes'    },
    { label: 'Rutinas',       icon: 'bi-list-check',      route: '/admin/rutinas'     },
    { label: 'Calendario',    icon: 'bi-calendar3',       route: '/admin/calendario'  },
    { label: 'Perfil',        icon: 'bi-person',          route: '/admin/perfil'      },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.actualizar();
    this.auth.usuario$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizar());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  irAModoProfesor(): void {
    this.router.navigate(['/profesor']);
  }

  private actualizar(): void {
    const u = this.auth.usuarioActual;
    this.nombre = u?.nombre ?? '';
    this.iniciales = this.calcularIniciales(this.nombre);
  }

  private calcularIniciales(nombre: string): string {
    const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
}