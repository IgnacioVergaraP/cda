import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import {
  ActualizarSeriePayload,
  CrearSeriePayload,
  Evolucion,
  HistorialFila,
  SesionDetalle,
} from '../models/progreso.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ProgresoService {

  private readonly baseUrl = `${environment.apiUrl}/progreso`;

  constructor(private http: HttpClient) {}

  listarHistorial(): Observable<HistorialFila[]> {
    return this.http
      .get<ApiResponse<HistorialFila[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  obtenerEvolucion(ejercicio: string): Observable<Evolucion> {
    const params = new HttpParams().set('ejercicio', ejercicio);
    return this.http
      .get<ApiResponse<Evolucion>>(`${this.baseUrl}/evolucion`, { params })
      .pipe(map(res => res.data));
  }

  obtenerSesion(ejercicio: string, fecha: string): Observable<SesionDetalle> {
    const params = new HttpParams()
      .set('ejercicio', ejercicio)
      .set('fecha', fecha);
    return this.http
      .get<ApiResponse<SesionDetalle>>(`${this.baseUrl}/sesion`, { params })
      .pipe(map(res => res.data));
  }

  registrarSerie(payload: CrearSeriePayload): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  actualizarSerie(id: string, payload: ActualizarSeriePayload): Observable<any> {
    return this.http
      .patch<ApiResponse<any>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }
}