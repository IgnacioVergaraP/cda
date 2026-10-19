import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  CrearSolicitudRutinaPayload,
  ProfesorDisponible,
  SolicitudRutina,
} from '../../profesor/models/solicitud-rutina.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudesRutinaService {

  private readonly baseUrl = `${environment.apiUrl}/profesor/solicitudes-rutina`;
  private readonly profesoresUrl = `${environment.apiUrl}/profesor/profesores-disponibles`;

  constructor(private http: HttpClient) {}

  crear(payload: CrearSolicitudRutinaPayload): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  listarMias(): Observable<SolicitudRutina[]> {
    return this.http
      .get<ApiResponse<SolicitudRutina[]>>(`${this.baseUrl}/mias`)
      .pipe(map(res => res.data));
  }

  cancelar(id: string): Observable<SolicitudRutina> {
    return this.http
      .post<ApiResponse<SolicitudRutina>>(`${this.baseUrl}/${id}/cancelar`, {})
      .pipe(map(res => res.data));
  }

  listarProfesores(): Observable<ProfesorDisponible[]> {
    return this.http
      .get<ApiResponse<ProfesorDisponible[]>>(this.profesoresUrl)
      .pipe(map(res => res.data));
  }
}