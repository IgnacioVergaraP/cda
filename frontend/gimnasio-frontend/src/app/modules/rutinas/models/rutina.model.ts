export type TipoEjercicio = 'maquina' | 'libre';

export interface MaquinaResumen {
  id: string;
  nombre: string;
  grupos_musculares: string[];
  imagen_url: string;
  descripcion: string;
  video_url: string;
}

export interface Ejercicio {
  id: string;
  tipo: TipoEjercicio;
  series: number;
  repeticiones: string;
  peso_sugerido: string | null;

  maquina_id?: string;
  maquina?: MaquinaResumen | null;

  nombre?: string;
  descripcion?: string;
}

export interface Rutina {
  id: string;
  titulo: string;
  grupos_musculares: string[];
  alumno_id: string;
  creada_por_alumno: boolean;
  profesor_id: string | null;
  profesor_nombre: string | null;
  activa: boolean;
  fecha_creacion: string;
  fecha_modificacion: string | null;
  ejercicios: Ejercicio[];
}