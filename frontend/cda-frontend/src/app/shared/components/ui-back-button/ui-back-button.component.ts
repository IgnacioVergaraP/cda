import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

const MAIN_MENU_ROUTES = new Set([
  '/maquinas',
  '/ejercicios',
  '/rutinas',
  '/progreso',
  '/usuario',
  '/profesor',
  '/profesor/alumnos',
  '/profesor/rutinas',
  '/profesor/subir',
  '/profesor/perfil',
  '/admin',
  '/admin/solicitudes',
  '/admin/reportes',
  '/admin/rutinas',
  '/admin/calendario',
]);

@Component({
  selector: 'app-ui-back-button',
  templateUrl: './ui-back-button.component.html',
  styleUrls: ['./ui-back-button.component.scss'],
})
export class UiBackButtonComponent {
  constructor(
    private location: Location,
    private router: Router,
  ) {}

  get visible(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    return !MAIN_MENU_ROUTES.has(path);
  }

  onBack(): void {
    this.location.back();
  }
}