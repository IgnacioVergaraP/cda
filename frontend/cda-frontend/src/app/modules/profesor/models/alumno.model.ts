import { User } from '../../../shared/models/user.model';

export interface AlumnoListItem {
  id: string;
  nombre: string;
  email: string;
  imagen_url: string | null;
}

export interface ResumenAlumno {
  rutinas_activas: number;
  sesiones_mes: number;
  racha_actual: number;
}

export interface PerfilAlumnoResponse {
  perfil: User;
  resumen: ResumenAlumno;
}

export interface DashboardProfesor {
  alumnos_activos_semana: number;
  alumnos_total: number;
  solicitudes_pendientes: number;
  reportes_abiertos: number;
  solicitudes_rutina_pendientes: number;
}

export interface ProfesorDisponible {
  id: string;
  nombre: string;
  especialidades: string[] | null;
  anios_experiencia: number | null;
}