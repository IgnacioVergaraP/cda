export type TipoEjercicio = 'maquina' | 'libre';

export interface MetricasEntrenamiento {
  modalidad?: 'fuerza' | 'cardio';
  peso_valor?: number | null;
  peso_unidad?: 'kg' | 'lb' | 'otro' | null;
  peso_kg?: number | null;
  repeticiones_valor?: number | null;
  duracion_segundos?: number | null;
  distancia_metros?: number | null;
}

export interface HistorialFila extends MetricasEntrenamiento {
  ejercicio_key?: string;
  ejercicio_catalogo_id?: string | null;
  ejercicio: string;
  ejercicio_tipo: TipoEjercicio;
  maquina_id: string | null;
  nombre_libre: string | null;
  fecha: string;
  cantidad_series: number;
  peso_max: number | null;
  rutina_id: string | null;
}

export interface PuntoEvolucion extends MetricasEntrenamiento {
  fecha: string;
  peso_max: number;
  cantidad_series: number;
}

export interface Evolucion extends MetricasEntrenamiento {
  ejercicio_key?: string;
  ejercicio_catalogo_id?: string | null;
  ejercicio: string;
  ejercicio_tipo: TipoEjercicio | null;
  maquina_id: string | null;
  nombre_libre: string | null;
  puntos: PuntoEvolucion[];
  pr_historico: number | null;
}

export interface CrearSeriePayload extends MetricasEntrenamiento {
  peso_texto?: string;
  ejercicio_catalogo_id?: string | null;
  recurso_ids?: string[];
  ejercicio_tipo?: TipoEjercicio;
  peso?: string;
  repeticiones?: string;
  maquina_id?: string | null;
  nombre_libre?: string | null;
  rutina_id?: string | null;
  numero_serie?: number;
}

export interface ActualizarSeriePayload extends MetricasEntrenamiento {
  peso?: string;
  repeticiones?: string;
  peso_texto?: string;
}

export interface SerieConfirmada extends MetricasEntrenamiento {
  id: string;
  numero_serie: number;
  peso: string;
  repeticiones: string;
}

export interface SerieEnSesion extends MetricasEntrenamiento {
  id: string;
  numero_serie: number;
  peso: string;
  repeticiones: string;
}

export interface SesionDetalle extends MetricasEntrenamiento {
  ejercicio_key?: string;
  ejercicio: string;
  ejercicio_tipo: TipoEjercicio;
  maquina_id: string | null;
  nombre_libre: string | null;
  fecha: string;
  series: SerieEnSesion[];
}
