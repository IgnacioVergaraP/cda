export type CategoriaEjercicio = 'maquina' | 'libre' | 'cardio';
export type TipoRecurso = 'maquina' | 'equipamiento' | 'infraestructura';
export interface Recurso {
  id: string;
  gimnasio_id: string;
  nombre: string;
  tipo: TipoRecurso;
  es_cardio?: boolean;
  numero_maquina: string | null;
  descripcion: string;
  maquina_origen_id: string | null;
}
export type RecursoPayload = Pick<Recurso, 'nombre' | 'tipo' | 'numero_maquina' | 'descripcion' | 'es_cardio'>;
export interface EjercicioCatalogo {
  id: string;
  gimnasio_id: string;
  nombre: string;
  categoria: CategoriaEjercicio;
  grupos_musculares: string[];
  descripcion: string;
  video_url: string;
  imagen_url: string;
  maquina_origen_id: string | null;
  recursos: Recurso[];
}
export interface EjercicioPayload extends Pick<EjercicioCatalogo, 'nombre' | 'categoria' | 'grupos_musculares' | 'descripcion' | 'video_url' | 'imagen_url'> {
  recurso_ids: string[];
}
export interface Pagina<T> { items: T[]; hay_mas: boolean; }
export const CATEGORIAS: { value: CategoriaEjercicio; label: string; icon: string }[] = [
  { value: 'maquina', label: 'En máquina', icon: 'bi-gear' },
  { value: 'libre', label: 'Libres', icon: 'bi-person-arms-up' },
  { value: 'cardio', label: 'Cardio', icon: 'bi-heart-pulse' },
];
export const TIPOS_RECURSO: { value: TipoRecurso; label: string }[] = [
  { value: 'maquina', label: 'Máquina' },
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'infraestructura', label: 'Infraestructura' },
];
export const etiquetaCategoria = (valor: string): string => CATEGORIAS.find(c => c.value === valor)?.label ?? valor;
export const etiquetaRecurso = (valor: string): string => TIPOS_RECURSO.find(t => t.value === valor)?.label ?? valor;
