import { Component, Input } from '@angular/core';

interface MuscleIllustration {
  key: string;
  label: string;
  src: string;
}

const MUSCLE_IMAGES: Record<string, MuscleIllustration> = {
  pecho: { key: 'pecho', label: 'Pectoral', src: '/assets/img/Pectoral.png' },
  pectoral: { key: 'pecho', label: 'Pectoral', src: '/assets/img/Pectoral.png' },
  espalda: { key: 'espalda', label: 'Dorsal', src: '/assets/img/Dorsal.png' },
  dorsal: { key: 'espalda', label: 'Dorsal', src: '/assets/img/Dorsal.png' },
  hombros: { key: 'hombros', label: 'Hombros', src: '/assets/img/hombros.png' },
  biceps: { key: 'biceps', label: 'Bíceps', src: '/assets/img/biceps.png' },
  triceps: { key: 'triceps', label: 'Tríceps', src: '/assets/img/tricep.png' },
  brazos: { key: 'biceps', label: 'Bíceps', src: '/assets/img/biceps.png' },
  antebrazos: { key: 'antebrazos', label: 'Antebrazos', src: '/assets/img/antebrazos.png' },
  piernas: { key: 'cuadriceps', label: 'Cuádriceps', src: '/assets/img/Cuadriceps.png' },
  cuadriceps: { key: 'cuadriceps', label: 'Cuádriceps', src: '/assets/img/Cuadriceps.png' },
  isquiotibiales: { key: 'isquiotibiales', label: 'Isquiotibiales', src: '/assets/img/Isquitibiales.png' },
  isquitibiales: { key: 'isquiotibiales', label: 'Isquiotibiales', src: '/assets/img/Isquitibiales.png' },
  gluteo: { key: 'gluteo', label: 'Glúteos', src: '/assets/img/Gluteo.png' },
  gluteos: { key: 'gluteo', label: 'Glúteos', src: '/assets/img/Gluteo.png' },
  abductores: { key: 'abductores', label: 'Abductores', src: '/assets/img/Abductores.png' },
  pantorrillas: { key: 'pantorrillas', label: 'Pantorrillas', src: '/assets/img/Pantorrillas.png' },
  gemelos: { key: 'pantorrillas', label: 'Pantorrillas', src: '/assets/img/Pantorrillas.png' },
  core: { key: 'abdomen', label: 'Abdomen', src: '/assets/img/abdomen.png' },
  abdomen: { key: 'abdomen', label: 'Abdomen', src: '/assets/img/abdomen.png' },
  abdominales: { key: 'abdomen', label: 'Abdomen', src: '/assets/img/abdomen.png' },
  oblicuos: { key: 'oblicuos', label: 'Oblicuos', src: '/assets/img/oblicuos.png' },
  trapecio: { key: 'trapecio', label: 'Trapecio', src: '/assets/img/Trapecio.png' },
};

@Component({
  selector: 'app-muscle-map',
  host: {
    '[class.app-muscle-map]': 'compact',
  },
  templateUrl: './muscle-map.component.html',
  styleUrls: ['./muscle-map.component.scss'],
})
export class MuscleMapComponent {

  @Input() muscles: string[] = [];
  @Input() primaryOnly = false;
  @Input() compact = false;

  get illustrations(): MuscleIllustration[] {
    const result: MuscleIllustration[] = [];
    const seen = new Set<string>();

    for (const muscle of this.muscles ?? []) {
      const normalized = muscle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
      const illustration = MUSCLE_IMAGES[normalized];
      if (!illustration || seen.has(illustration.key)) continue;
      seen.add(illustration.key);
      result.push(illustration);
      if (this.primaryOnly) break;
    }

    return result;
  }
}