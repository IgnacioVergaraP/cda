export interface Horario {
  id: string;
  profesor_id: string;
  profesor_nombre: string;
  dia_semana: number;        // 0 = lunes, 6 = domingo
  hora_inicio: string;       // "HH:MM"
  hora_fin: string;          // "HH:MM"
  notas: string | null;
  fecha_creacion: string;
}

export interface ProfesorAdmin {
  id: string;
  nombre: string;
  rol: 'profesor' | 'gimnasio';
}

export interface CrearHorarioPayload {
  profesor_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  notas?: string | null;
}

export interface EditarHorarioPayload {
  dia_semana?: number;
  hora_inicio?: string;
  hora_fin?: string;
  notas?: string | null;
}

export const DIAS_SEMANA: { value: number; short: string; long: string }[] = [
  { value: 0, short: 'Lun', long: 'Lunes' },
  { value: 1, short: 'Mar', long: 'Martes' },
  { value: 2, short: 'Mié', long: 'Miércoles' },
  { value: 3, short: 'Jue', long: 'Jueves' },
  { value: 4, short: 'Vie', long: 'Viernes' },
  { value: 5, short: 'Sáb', long: 'Sábado' },
  { value: 6, short: 'Dom', long: 'Domingo' },
];

export function nombreDia(dia: number, corto = false): string {
  const d = DIAS_SEMANA.find(x => x.value === dia);
  if (!d) return '';
  return corto ? d.short : d.long;
}