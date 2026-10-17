import { interpretarPeso } from '../../../shared/utils/peso';
import { ActualizarSeriePayload, MetricasEntrenamiento } from './progreso.model';

export interface MetricasFormulario {
  modalidad: 'fuerza' | 'cardio';
  peso_unidad: 'kg' | 'lb' | 'otro';
  peso_valor: number | null;
  peso_texto: string;
  repeticiones_valor: number | null;
  duracion_segundos: number | null;
  distancia_metros: number | null;
}

export function metricasFormulario(serie?: MetricasEntrenamiento & { peso?: string; repeticiones?: string }): MetricasFormulario {
  const peso = interpretarPeso(serie?.peso);
  const reps = Number(serie?.repeticiones);
  return {
    modalidad: serie?.modalidad ?? 'fuerza',
    peso_unidad: serie?.peso_unidad ?? peso.unidad,
    peso_valor: serie?.peso_valor ?? peso.valor,
    peso_texto: serie?.peso_unidad === 'otro' ? serie.peso ?? '' : peso.texto,
    repeticiones_valor: serie?.repeticiones_valor ?? (Number.isInteger(reps) && reps > 0 ? reps : null),
    duracion_segundos: serie?.duracion_segundos ?? null,
    distancia_metros: serie?.distancia_metros ?? null,
  };
}

export function metricasValidas(m: MetricasFormulario): boolean {
  const numero = (n: number | null, min: number, max: number) => n !== null && Number.isFinite(n) && n >= min && n <= max;
  if (m.modalidad === 'cardio') {
    return (m.duracion_segundos !== null || m.distancia_metros !== null)
      && (m.duracion_segundos === null || (numero(m.duracion_segundos, 1, 604800) && Number.isInteger(m.duracion_segundos)))
      && (m.distancia_metros === null || numero(m.distancia_metros, 0.01, 1000000));
  }
  return numero(m.repeticiones_valor, 1, 10000) && Number.isInteger(m.repeticiones_valor)
    && (m.peso_unidad === 'otro' ? !!m.peso_texto.trim() && m.peso_texto.trim().length <= 100 : numero(m.peso_valor, 0, 10000));
}

export function metricasPayload(m: MetricasFormulario): ActualizarSeriePayload {
  return m.modalidad === 'cardio'
    ? { modalidad: 'cardio', duracion_segundos: m.duracion_segundos, distancia_metros: m.distancia_metros }
    : { modalidad: 'fuerza', peso_unidad: m.peso_unidad, repeticiones_valor: m.repeticiones_valor,
        ...(m.peso_unidad === 'otro' ? { peso_texto: m.peso_texto.trim() } : { peso_valor: m.peso_valor }) };
}

export function resumenRegistro(s: MetricasEntrenamiento & { peso?: string; repeticiones?: string }): string {
  if (s.modalidad !== 'cardio') return `${s.peso ?? ''} × ${s.repeticiones ?? ''} reps`;
  const partes: string[] = [];
  if (s.duracion_segundos) partes.push(`${Math.round(s.duracion_segundos / 60 * 100) / 100} min`);
  if (s.distancia_metros) partes.push(`${Math.round(s.distancia_metros / 1000 * 1000) / 1000} km`);
  return partes.join(' · ');
}
