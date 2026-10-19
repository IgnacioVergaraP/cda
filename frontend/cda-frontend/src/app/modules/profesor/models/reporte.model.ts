export type EstadoReporte = 'abierto' | 'en_revision' | 'resuelto' | 'cancelado';

export type TipoReporte = 'rota' | 'desgastada' | 'falta_accesorio' | 'limpieza' | 'otro';

export type PrioridadReporte = 'baja' | 'media' | 'alta' | 'urgente';

export interface Reporte {
  id: string;
  estado: EstadoReporte;
  tipo: TipoReporte;
  prioridad: PrioridadReporte;
  descripcion: string;
  reportante_id: string;
  reportante_nombre: string;
  maquina_id: string | null;
  maquina_nombre: string | null;
  foto_url: string | null;
  resolucion: string | null;
  revisado_por_id: string | null;
  revisado_por_nombre: string | null;
  fecha_creacion: string;
  fecha_revision: string | null;
}

export interface CrearReportePayload {
  tipo: TipoReporte;
  prioridad: PrioridadReporte;
  descripcion: string;
  maquina_id?: string | null;
  foto_url?: string | null;
}

export const TIPOS_REPORTE: { value: TipoReporte; label: string }[] = [
  { value: 'rota',            label: 'Rota' },
  { value: 'desgastada',      label: 'Desgastada' },
  { value: 'falta_accesorio', label: 'Falta accesorio' },
  { value: 'limpieza',        label: 'Limpieza' },
  { value: 'otro',            label: 'Otro' },
];

export const PRIORIDADES_REPORTE: { value: PrioridadReporte; label: string }[] = [
  { value: 'baja',    label: 'Baja' },
  { value: 'media',   label: 'Media' },
  { value: 'alta',    label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export function etiquetaTipo(t: TipoReporte): string {
  return TIPOS_REPORTE.find(x => x.value === t)?.label ?? t;
}

export function etiquetaPrioridad(p: PrioridadReporte): string {
  return PRIORIDADES_REPORTE.find(x => x.value === p)?.label ?? p;
}