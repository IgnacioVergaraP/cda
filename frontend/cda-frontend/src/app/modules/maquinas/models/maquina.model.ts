export interface Maquina {
  id: string;
  nombre: string;
  grupos_musculares: string[];
  descripcion: string;
  video_url: string;
  imagen_url: string;
}

export const GRUPOS_MUSCULARES: readonly string[] = [
  'pecho',
  'espalda',
  'piernas',
  'hombros',
  'brazos',
  'biceps',
  'triceps',
  'core',
] as const;

export function etiquetaMusculo(musculo: string): string {
  const map: Record<string, string> = {
    pecho: 'Pecho',
    espalda: 'Espalda',
    piernas: 'Piernas',
    hombros: 'Hombros',
    brazos: 'Brazos',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    core: 'Core',
  };
  return map[musculo.toLowerCase()] ?? musculo;
}