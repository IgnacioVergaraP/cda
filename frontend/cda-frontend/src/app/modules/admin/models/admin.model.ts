export interface DashboardAdmin {
  solicitudes_ejercicios: number;
  reportes_pendientes: number;
  solicitudes_rutina_activas: number;
  liberaciones_pendientes: number;
}

export interface CountSolicitudes {
  count: number;
}

export interface CountReportes {
  abiertos: number;
  en_revision: number;
  resueltos: number;
  total_pendientes: number;
}