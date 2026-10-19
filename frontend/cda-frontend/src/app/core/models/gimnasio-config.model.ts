export interface GimnasioConfig {
  id: string;
  nombre: string;
  slug: string;
  color_primario: string;
  logo_url: string | null;
  tabs_habilitadas: string[];
  activo: boolean;
  fecha_creacion: string | null;
}