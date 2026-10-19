import { CategoriaEjercicio, Recurso } from '../../ejercicios/models/catalogo.model';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export type TipoSolicitud = 'crear';

export interface Solicitud {
  id: string;
  tipo_solicitud: TipoSolicitud;
  estado: EstadoSolicitud;
  solicitante_id: string;
  solicitante_nombre: string;
  categoria?: CategoriaEjercicio | null;
  recurso_ids?: string[];
  recursos?: Recurso[];
  ejercicio_catalogo_id_creado?: string | null;
  nombre: string;
  grupos_musculares: string[];
  descripcion: string;
  video_url: string;
  imagen_url: string;
  maquina_id_objetivo: string | null;
  maquina_id_creado: string | null;
  revisado_por_id: string | null;
  revisado_por_nombre: string | null;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  fecha_revision: string | null;
}

export interface CrearSolicitudPayload {
  categoria?: CategoriaEjercicio;
  recurso_ids?: string[];
  nombre: string;
  grupos_musculares: string[];
  descripcion: string;
  video_url: string;
  imagen_url: string;
}