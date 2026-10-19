import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Solicitud } from '../../profesor/models/solicitud.model';
import { Reporte } from '../../profesor/models/reporte.model';
import { SolicitudRutina } from '../../profesor/models/solicitud-rutina.model';
import { CountReportes, CountSolicitudes } from '../models/admin.model';
import {
  CrearHorarioPayload,
  EditarHorarioPayload,
  Horario,
  ProfesorAdmin,
} from '../models/horario.model';
import {
  CrearMantenimientoPayload,
  DashboardUso,
  FiltroTipoRecurso,
  Mantenimiento,
  MaquinaMantenimientosResponse,
  RangoAnalytics,
} from '../models/analytics.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  private readonly baseUrl = `${environment.apiUrl}/profesor`;
  private readonly adminUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // -------- Solicitudes de ejercicios --------

  listarSolicitudesPendientes(): Observable<Solicitud[]> {
    return this.http
      .get<ApiResponse<Solicitud[]>>(`${this.baseUrl}/admin/pendientes`)
      .pipe(map(res => res.data));
  }

  contarSolicitudesPendientes(): Observable<CountSolicitudes> {
    return this.http
      .get<ApiResponse<CountSolicitudes>>(`${this.baseUrl}/admin/pendientes/count`)
      .pipe(map(res => res.data));
  }

  aprobarSolicitud(id: string): Observable<Solicitud> {
    return this.http
      .post<ApiResponse<Solicitud>>(`${this.baseUrl}/admin/solicitudes/${id}/aprobar`, {})
      .pipe(map(res => res.data));
  }

  rechazarSolicitud(id: string, motivo: string): Observable<Solicitud> {
    return this.http
      .post<ApiResponse<Solicitud>>(`${this.baseUrl}/admin/solicitudes/${id}/rechazar`, { motivo })
      .pipe(map(res => res.data));
  }

  // -------- Reportes --------

  listarTodosReportes(): Observable<Reporte[]> {
    return this.http
      .get<ApiResponse<Reporte[]>>(`${this.baseUrl}/admin/reportes`)
      .pipe(map(res => res.data));
  }

  contarReportes(): Observable<CountReportes> {
    return this.http
      .get<ApiResponse<CountReportes>>(`${this.baseUrl}/admin/reportes/count`)
      .pipe(map(res => res.data));
  }

  marcarReporteEnRevision(id: string): Observable<Reporte> {
    return this.http
      .post<ApiResponse<Reporte>>(`${this.baseUrl}/admin/reportes/${id}/en-revision`, {})
      .pipe(map(res => res.data));
  }

  resolverReporte(id: string, resolucion: string | null): Observable<Reporte> {
    return this.http
      .post<ApiResponse<Reporte>>(`${this.baseUrl}/admin/reportes/${id}/resolver`, { resolucion })
      .pipe(map(res => res.data));
  }

  // -------- Solicitudes de rutina --------

  listarTodasSolicitudesRutina(): Observable<SolicitudRutina[]> {
    return this.http
      .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/admin/solicitudes-rutina`)
      .pipe(map(res => res.data));
  }

  listarLiberacionesPendientes(): Observable<SolicitudRutina[]> {
    return this.http
      .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/admin/solicitudes-rutina/liberaciones`)
      .pipe(map(res => res.data));
  }

  aprobarLiberacion(id: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/admin/solicitudes-rutina/${id}/liberar/aprobar`, {})
      .pipe(map(res => res.data));
  }

  rechazarLiberacion(id: string, motivo: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/admin/solicitudes-rutina/${id}/liberar/rechazar`, { motivo })
      .pipe(map(res => res.data));
  }

  // -------- Horarios --------

  listarProfesores(): Observable<ProfesorAdmin[]> {
    return this.http
      .get<ApiResponse<ProfesorAdmin[]>>(`${this.adminUrl}/profesores`)
      .pipe(map(res => res.data));
  }

  listarHorarios(profesorId?: string | null): Observable<Horario[]> {
    let params = new HttpParams();
    if (profesorId) params = params.set('profesor_id', profesorId);
    return this.http
      .get<ApiResponse<Horario[]>>(`${this.adminUrl}/horarios`, { params })
      .pipe(map(res => res.data));
  }

  crearHorario(payload: CrearHorarioPayload): Observable<Horario> {
    return this.http
      .post<ApiResponse<Horario>>(`${this.adminUrl}/horarios`, payload)
      .pipe(map(res => res.data));
  }

  editarHorario(id: string, payload: EditarHorarioPayload): Observable<Horario> {
    return this.http
      .put<ApiResponse<Horario>>(`${this.adminUrl}/horarios/${id}`, payload)
      .pipe(map(res => res.data));
  }

  eliminarHorario(id: string): Observable<{ id: string; eliminado: boolean }> {
    return this.http
      .delete<ApiResponse<{ id: string; eliminado: boolean }>>(`${this.adminUrl}/horarios/${id}`)
      .pipe(map(res => res.data));
  }

  // -------- Dashboard de uso --------

  obtenerDashboardUso(rango: RangoAnalytics, tipo: FiltroTipoRecurso = ''): Observable<DashboardUso> {
    const params = new HttpParams().set('rango', rango).set('tipo', tipo);
    return this.http
      .get<ApiResponse<DashboardUso>>(`${this.adminUrl}/dashboard/uso`, { params })
      .pipe(map(res => res.data));
  }

  // -------- Mantenciones --------

  listarMantenimientos(): Observable<Mantenimiento[]> {
    return this.http
      .get<ApiResponse<Mantenimiento[]>>(`${this.adminUrl}/mantenimientos`)
      .pipe(map(res => res.data));
  }

  listarMantenimientosMaquina(maquinaId: string): Observable<MaquinaMantenimientosResponse> {
    return this.http
      .get<ApiResponse<MaquinaMantenimientosResponse>>(`${this.adminUrl}/maquinas/${maquinaId}/mantenimientos`)
      .pipe(map(res => res.data));
  }

  crearMantenimiento(payload: CrearMantenimientoPayload): Observable<Mantenimiento> {
    return this.http
      .post<ApiResponse<Mantenimiento>>(`${this.adminUrl}/mantenimientos`, payload)
      .pipe(map(res => res.data));
  }

  eliminarMantenimiento(id: string): Observable<{ id: string; eliminado: boolean }> {
    return this.http
      .delete<ApiResponse<{ id: string; eliminado: boolean }>>(`${this.adminUrl}/mantenimientos/${id}`)
      .pipe(map(res => res.data));
  }
}