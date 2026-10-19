import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-admin-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {

  usuario: User | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.usuario = this.auth.usuarioActual;
  }

  get miembroDesde(): string {
    if (!this.usuario?.fecha_alta) return '—';
    const d = new Date(this.usuario.fecha_alta);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  cerrarSesion(): void {
    this.auth.logout(true);
  }
}