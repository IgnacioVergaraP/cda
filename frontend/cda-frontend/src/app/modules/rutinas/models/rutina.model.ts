import { EjercicioCatalogo } from '../../ejercicios/models/catalogo.model';

export type TipoEjercicio = 'maquina' | 'libre';

export interface MaquinaResumen {
  id: string;
  nombre: string;
  grupos_musculares: string[];
  imagen_url: string;
  descripcion: string;
  video_url: string;
}

export interface PrescripcionCardio {
  intensidad?: string | null;
  duracion_minutos?: number | null;
  distancia_km?: number | null;
}

export interface Ejercicio {
  id: string;
  tipo: TipoEjercicio;
  series: number;
  repeticiones: string;
  peso_sugerido: string | null;
  ejercicio_catalogo_id?: string | null;
  prescripcion_cardio?: PrescripcionCardio | null;
  catalogo?: EjercicioCatalogo | null;

  maquina_id?: string;
  maquina?: MaquinaResumen | null;

  nombre?: string;
  descripcion?: string;
}

export interface Rutina {
  id: string;
  titulo: string;
  grupos_musculares: string[];
  alumno_id: string | null;
  es_publica: boolean;
  rutina_origen_id: string | null;
  disciplina: string | null;
  objetivo: string | null;
  nivel: string | null;
  equipamiento: string | null;
  descripcion: string | null;
  copia_id?: string | null;
  creada_por_alumno: boolean;
  profesor_id: string | null;
  profesor_nombre: string | null;
  activa: boolean;
  fecha_creacion: string;
  fecha_modificacion: string | null;
  ejercicios: Ejercicio[];
}

export function resumenCardio(e: Pick<Ejercicio, 'prescripcion_cardio' | 'repeticiones'>): string {
  const p = e.prescripcion_cardio;
  if (!p) return e.repeticiones?.trim() || 'Cardio';
  return [p.intensidad, p.duracion_minutos != null ? `${p.duracion_minutos} min` : '',
    p.distancia_km != null ? `${p.distancia_km} km` : ''].filter(Boolean).join(' · ') || 'Cardio';
}
