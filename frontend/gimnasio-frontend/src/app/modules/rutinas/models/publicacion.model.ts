import { EditarRutinaPayload } from '../../profesor/models/rutina-builder.model';
import { Rutina } from './rutina.model';

export interface PublicacionPayload extends EditarRutinaPayload {
  disciplina: string;
  nivel: string;
  objetivo: string;
  equipamiento: string;
  descripcion: string;
}

export interface PaginaPublicaciones { items: Rutina[]; hay_mas: boolean; }

export const DISCIPLINAS = [
  { value: 'musculacion', label: 'Musculación' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'futbol', label: 'Fútbol' },
  { value: 'basquetbol', label: 'Básquetbol' },
  { value: 'atletismo', label: 'Atletismo' },
  { value: 'natacion', label: 'Natación' },
  { value: 'otro', label: 'Otra disciplina' },
];
export const NIVELES = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export function etiquetaDisciplina(valor: string | null): string {
  return DISCIPLINAS.find(d => d.value === valor)?.label ?? valor ?? '';
}
export function etiquetaNivel(valor: string | null): string {
  return NIVELES.find(n => n.value === valor)?.label ?? valor ?? '';
}
