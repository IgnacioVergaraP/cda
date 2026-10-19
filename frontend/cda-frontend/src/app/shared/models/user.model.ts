export type UserRole = 'gimnasio' | 'profesor' | 'alumno';

export type OrigenGrasa = 'profesor' | 'alumno';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;

  // Perfil físico (alumnos)
  altura: number | null;
  peso_actual: number | null;
  peso_objetivo: number | null;
  imagen_url: string | null;
  porcentaje_grasa: number | null;
  fecha_medicion_grasa: string | null;
  origen_grasa: OrigenGrasa | null;
  cargado_por_id: string | null;

  // Perfil profesional (profesores)
  bio: string | null;
  especialidades: string[] | null;
  anios_experiencia: number | null;
  telefono: string | null;

  // Notas internas del profesor sobre el alumno
  notas_profesor: string | null;

  // Metadata
  fecha_alta: string | null;

  // Calculado por el backend
  imc: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;
}

export interface ActualizarPerfilPayload {
  nombre?: string;
  altura?: number | null;
  peso_actual?: number | null;
  peso_objetivo?: number | null;
  imagen_url?: string | null;
  porcentaje_grasa?: number | null;
  fecha_medicion_grasa?: string | null;
  bio?: string | null;
  especialidades?: string[] | null;
  anios_experiencia?: number | null;
  telefono?: string | null;
}