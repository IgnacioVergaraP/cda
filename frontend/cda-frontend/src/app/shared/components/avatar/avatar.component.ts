import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {

  @Input() nombre = '';
  @Input() imagenUrl: string | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get tieneImagen(): boolean {
    return !!this.imagenUrl;
  }

  get iniciales(): string {
    const partes = (this.nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /**
   * Deriva un índice 0-7 a partir del nombre para elegir un color consistente.
   * Mismo nombre → mismo color siempre.
   */
  get colorIndex(): number {
    const n = this.nombre || '';
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = (hash * 31 + n.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 8;
  }
}