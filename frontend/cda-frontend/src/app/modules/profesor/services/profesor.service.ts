import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Horario } from '../../admin/models/horario.model';

import { environment } from '../../../../environments/environment';
import {
  AlumnoListItem,
  DashboardProfesor,
  PerfilAlumnoResponse,
  ProfesorDisponible,
} from '../models/alumno.model';
import { CrearSolicitudPayload, Solicitud } from '../models/solicitud.model';
import { CrearReportePayload, Reporte } from '../models/reporte.model';
import { SolicitudRutina } from '../models/solicitud-rutina.model';
import {
  CrearRutinaPayload,
  DuplicarRutinaPayload,
  EditarDatosAlumnoPayload,
  EditarRutinaPayload,
} from '../models/rutina-builder.model';
import { Rutina } from '../../rutinas/models/rutina.model';
import { Evolucion, HistorialFila } from '../../progreso/models/progreso.model';
import { User } from '../../../shared/models/user.model';

interface ApiResponse<T> {
  data: T;
}

export interface ProgresoAlumnoResponse {
  historial: HistorialFila[];
  evolucion: Evolucion | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfesorService {

  private readonly baseUrl = `${environment.apiUrl}/profesor`;

  constructor(private http: HttpClient) {}

  // -------- Dashboard --------

  obtenerDashboard(): Observable<DashboardProfesor> {
    return this.http
      .get<ApiResponse<DashboardProfesor>>(`${this.baseUrl}/dashboard`)
      .pipe(map(res => res.data));
  }

  // -------- Alumnos --------

  listarAlumnos(): Observable<AlumnoListItem[]> {
    return this.http
      .get<ApiResponse<AlumnoListItem[]>>(`${this.baseUrl}/alumnos`)
      .pipe(map(res => res.data));
  }

  obtenerPerfilAlumno(id: string): Observable<PerfilAlumnoResponse> {
    return this.http
      .get<ApiResponse<PerfilAlumnoResponse>>(`${this.baseUrl}/alumnos/${id}/perfil`)
      .pipe(map(res => res.data));
  }

  editarDatosAlumno(id: string, payload: EditarDatosAlumnoPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.baseUrl}/alumnos/${id}/perfil`, payload)
      .pipe(map(res => res.data));
  }

  obtenerProgresoAlumno(id: string): Observable<ProgresoAlumnoResponse> {
    return this.http
      .get<ApiResponse<ProgresoAlumnoResponse>>(`${this.baseUrl}/alumnos/${id}/progreso`)
      .pipe(map(res => res.data));
  }

  listarProfesoresDisponibles(): Observable<ProfesorDisponible[]> {
    return this.http
      .get<ApiResponse<ProfesorDisponible[]>>(`${this.baseUrl}/profesores-disponibles`)
      .pipe(map(res => res.data));
  }

  // -------- Rutinas (builder) --------

  listarRutinas(incluirInactivas = false): Observable<Rutina[]> {
    const q = incluirInactivas ? '?incluir_inactivas=true' : '';
    return this.http
      .get<ApiResponse<Rutina[]>>(`${this.baseUrl}/rutinas${q}`)
      .pipe(map(res => res.data));
  }

  obtenerRutina(id: string): Observable<Rutina> {
    return this.http
      .get<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas/${id}`)
      .pipe(map(res => res.data));
  }

  crearRutina(payload: CrearRutinaPayload): Observable<Rutina> {
    return this.http
      .post<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas`, payload)
      .pipe(map(res => res.data));
  }

  editarRutina(id: string, payload: EditarRutinaPayload): Observable<Rutina> {
    return this.http
      .put<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas/${id}`, payload)
      .pipe(map(res => res.data));
  }

  archivarRutina(id: string): Observable<Rutina> {
    return this.http
      .patch<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas/${id}/archivar`, {})
      .pipe(map(res => res.data));
  }

  reactivarRutina(id: string): Observable<Rutina> {
    return this.http
      .patch<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  duplicarRutina(id: string, payload: DuplicarRutinaPayload): Observable<Rutina> {
    return this.http
      .post<ApiResponse<Rutina>>(`${this.baseUrl}/rutinas/${id}/duplicar`, payload)
      .pipe(map(res => res.data));
  }

  listarRutinasDeAlumno(alumnoId: string, incluirInactivas = false): Observable<Rutina[]> {
    const q = incluirInactivas ? '?incluir_inactivas=true' : '';
    return this.http
      .get<ApiResponse<Rutina[]>>(`${this.baseUrl}/alumnos/${alumnoId}/rutinas${q}`)
      .pipe(map(res => res.data));
  }

  // -------- Solicitudes de ejercicio --------

  crearSolicitud(payload: CrearSolicitudPayload): Observable<Solicitud> {
    return this.http
      .post<ApiResponse<Solicitud>>(`${this.baseUrl}/solicitudes`, payload)
      .pipe(map(res => res.data));
  }

  listarMisSolicitudes(): Observable<Solicitud[]> {
    return this.http
      .get<ApiResponse<Solicitud[]>>(`${this.baseUrl}/solicitudes/mias`)
      .pipe(map(res => res.data));
  }

  cancelarSolicitud(id: string): Observable<Solicitud> {
    return this.http
      .post<ApiResponse<Solicitud>>(`${this.baseUrl}/solicitudes/${id}/cancelar`, {})
      .pipe(map(res => res.data));
  }

  // -------- Reportes --------

  crearReporte(payload: CrearReportePayload): Observable<Reporte> {
    return this.http
      .post<ApiResponse<Reporte>>(`${this.baseUrl}/reportes`, payload)
      .pipe(map(res => res.data));
  }

  listarMisReportes(): Observable<Reporte[]> {
    return this.http
      .get<ApiResponse<Reporte[]>>(`${this.baseUrl}/reportes/mios`)
      .pipe(map(res => res.data));
  }

  cancelarReporte(id: string): Observable<Reporte> {
    return this.http
      .post<ApiResponse<Reporte>>(`${this.baseUrl}/reportes/${id}/cancelar`, {})
      .pipe(map(res => res.data));
  }

  // -------- Solicitudes de rutina --------

  listarSolicitudesRutinaDisponibles(): Observable<SolicitudRutina[]> {
    return this.http
      .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/solicitudes-rutina/disponibles`)
      .pipe(map(res => res.data));
  }

  listarSolicitudesRutinaTomadas(): Observable<SolicitudRutina[]> {
    return this.http
      .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/solicitudes-rutina/tomadas`)
      .pipe(map(res => res.data));
  }

  tomarSolicitudRutina(id: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/solicitudes-rutina/${id}/tomar`, {})
      .pipe(map(res => res.data));
  }

  resolverSolicitudRutina(id: string, mensaje: string, rutinaId: string | null): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/solicitudes-rutina/${id}/resolver`, {
        mensaje_resolucion: mensaje,
        rutina_id: rutinaId,
      })
      .pipe(map(res => res.data));
  }

  rechazarSolicitudRutina(id: string, motivo: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/solicitudes-rutina/${id}/rechazar`, { motivo })
      .pipe(map(res => res.data));
  }

  solicitarLiberacion(id: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/solicitudes-rutina/${id}/solicitar-liberacion`, {})
      .pipe(map(res => res.data));
  }

  listarSolicitudesRutinaDeAlumno(alumnoId: string): Observable<SolicitudRutina[]> {
    return this.http
        .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/alumnos/${alumnoId}/solicitudes-rutina`)
        .pipe(map(res => res.data));
    }

    listarMisHorarios(): Observable<Horario[]> {
  return this.http
    .get<ApiResponse<Horario[]>>(`${this.baseUrl}/mis-horarios`)
    .pipe(map(res => res.data));
}
}