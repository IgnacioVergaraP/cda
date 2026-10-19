import { interpretarPeso, UnidadPeso } from '../../../shared/utils/peso';
import { Ejercicio, PrescripcionCardio } from '../../rutinas/models/rutina.model';
import { EjercicioCatalogo } from '../../ejercicios/models/catalogo.model';

/** Ejercicio en el builder: puede ser nuevo o existente. */
export interface EjercicioBuilder {
  uid: string;
  usar_catalogo?: boolean;
  categoria_seleccionada?: string;
  ejercicio_catalogo_id?: string | null;
  prescripcion_cardio?: PrescripcionCardio | null;
  catalogo?: EjercicioCatalogo | null;
  tipo: 'maquina' | 'libre';
  series: number;
  repeticiones: string;
  peso_sugerido: string;
  peso_unidad: UnidadPeso;
  peso_valor: number | null;
  peso_otro: string;
  maquina_id: string | null;
  maquina_nombre?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  /** Si está minimizado, la card se ve compacta. */
  minimizado: boolean;
}

export interface CrearRutinaPayload {
  alumno_id: string;
  titulo: string;
  grupos_musculares: string[];
  ejercicios: {
    id?: string;
    ejercicio_catalogo_id?: string | null;
    prescripcion_cardio?: PrescripcionCardio | null;
    tipo: 'maquina' | 'libre';
    series: number;
    repeticiones: string;
    peso_sugerido: string;
    maquina_id?: string | null;
    nombre?: string | null;
    descripcion?: string | null;
  }[];
}

export interface EditarRutinaPayload {
  titulo: string;
  grupos_musculares: string[];
  ejercicios: {
    id?: string;
    ejercicio_catalogo_id?: string | null;
    prescripcion_cardio?: PrescripcionCardio | null;
    tipo: 'maquina' | 'libre';
    series: number;
    repeticiones: string;
    peso_sugerido: string;
    maquina_id?: string | null;
    nombre?: string | null;
    descripcion?: string | null;
  }[];
}

export interface DuplicarRutinaPayload {
  nuevo_alumno_id: string;
}

export interface EditarDatosAlumnoPayload {
  peso_actual?: number | null;
  peso_objetivo?: number | null;
  porcentaje_grasa?: number | null;
  notas_profesor?: string | null;
}

export function generarUid(): string {
  return 'b-' + Math.random().toString(36).slice(2, 10);
}

export function ejercicioExistenteABuilder(e: Ejercicio): EjercicioBuilder {
  return {
    uid: e.id,
    usar_catalogo: !!e.ejercicio_catalogo_id,
    ejercicio_catalogo_id: e.ejercicio_catalogo_id ?? null,
    catalogo: e.catalogo ?? null,
    categoria_seleccionada: e.catalogo?.categoria ?? '',
    prescripcion_cardio: e.prescripcion_cardio ?? (e.catalogo?.categoria === 'cardio' ? {} : null),
    tipo: e.tipo,
    series: e.series,
    repeticiones: e.repeticiones,
    peso_sugerido: e.peso_sugerido ?? '',
    peso_unidad: interpretarPeso(e.peso_sugerido).unidad,
    peso_valor: interpretarPeso(e.peso_sugerido).valor,
    peso_otro: interpretarPeso(e.peso_sugerido).texto,
    maquina_id: e.maquina_id ?? null,
    maquina_nombre: e.maquina?.nombre ?? null,
    nombre: e.nombre ?? null,
    descripcion: e.descripcion ?? null,
    minimizado: false,
  };
}

export function pesoBuilderValido(e: EjercicioBuilder): boolean {
  if (e.peso_unidad === 'otro') return !!e.peso_otro.trim() && e.peso_otro.trim().length <= 40;
  return e.peso_valor !== null && Number.isFinite(e.peso_valor) && e.peso_valor > 0
    && `${e.peso_valor} ${e.peso_unidad}`.length <= 40;
}
