export type EstadoSolicitudRutina =
  | 'pendiente'
  | 'en_proceso'
  | 'resuelta'
  | 'rechazada'
  | 'cancelada';

export type EstadoLiberacion = 'solicitada' | 'aprobada' | 'rechazada';

export type ObjetivoRutina =
  | 'hipertrofia'
  | 'fuerza'
  | 'resistencia'
  | 'perder_grasa'
  | 'mantenimiento'
  | 'otro';

export interface SolicitudRutina {
  id: string;
  estado: EstadoSolicitudRutina;
  alumno_id: string;
  alumno_nombre: string;
  objetivo: ObjetivoRutina;
  dias_por_semana: number;
  comentarios: string | null;
  grupos_interes: string[] | null;

  profesor_preferido_id: string | null;
  profesor_preferido_nombre: string | null;
  profesor_id: string | null;
  profesor_nombre: string | null;

  rutina_id: string | null;
  mensaje_resolucion: string | null;
  motivo_rechazo: string | null;

  estado_liberacion: EstadoLiberacion | null;
  fecha_liberacion_solicitada: string | null;
  liberacion_revisada_por_id: string | null;
  liberacion_revisada_por_nombre: string | null;
  liberacion_motivo_rechazo: string | null;

  fecha_creacion: string;
  fecha_tomada: string | null;
  fecha_revision: string | null;
}

export interface CrearSolicitudRutinaPayload {
  objetivo: ObjetivoRutina;
  dias_por_semana: number;
  comentarios?: string | null;
  grupos_interes?: string[] | null;
  profesor_preferido_id?: string | null;
}

export const OBJETIVOS_RUTINA: { value: ObjetivoRutina; label: string }[] = [
  { value: 'hipertrofia',   label: 'Hipertrofia' },
  { value: 'fuerza',        label: 'Fuerza' },
  { value: 'resistencia',   label: 'Resistencia' },
  { value: 'perder_grasa',  label: 'Perder grasa' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otro',          label: 'Otro' },
];

export function etiquetaObjetivo(o: ObjetivoRutina): string {
  return OBJETIVOS_RUTINA.find(x => x.value === o)?.label ?? o;
}

export interface ProfesorDisponible {
  id: string;
  nombre: string;
  especialidades: string[] | null;
  anios_experiencia: number | null;
}