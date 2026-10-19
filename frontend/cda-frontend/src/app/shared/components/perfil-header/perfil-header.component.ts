import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-perfil-header',
  templateUrl: './perfil-header.component.html',
  styleUrls: ['./perfil-header.component.scss'],
})
export class PerfilHeaderComponent {

  @Input() usuario!: User;
  @Input() mostrarEditar = true;

  @Output() editar = new EventEmitter<void>();

  get rolEtiqueta(): string {
    const map: Record<string, string> = {
      gimnasio: 'Gimnasio',
      profesor: 'Profesor',
      alumno: 'Alumno',
    };
    return map[this.usuario?.rol ?? ''] ?? this.usuario?.rol ?? '';
  }

  onEditar(): void {
    this.editar.emit();
  }
}