import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { EditarRutinaPayload } from '../../profesor/models/rutina-builder.model';
import { PaginaPublicaciones, PublicacionPayload } from '../models/publicacion.model';
import { Rutina } from '../models/rutina.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class RutinasService {

  private readonly baseUrl = `${environment.apiUrl}/rutinas`;

  constructor(private http: HttpClient) {}

  listar(incluirInactivas = false): Observable<Rutina[]> {
    const q = incluirInactivas ? '?incluir_inactivas=true' : '';
    return this.http
      .get<ApiResponse<Rutina[]>>(`${this.baseUrl}${q}`)
      .pipe(map(res => res.data));
  }

  crear(payload: EditarRutinaPayload): Observable<Rutina> {
    return this.http.post<ApiResponse<Rutina>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  editarPersonal(id: string, payload: EditarRutinaPayload): Observable<Rutina> {
    return this.http.put<ApiResponse<Rutina>>(`${this.baseUrl}/${id}`, payload).pipe(map(r => r.data));
  }

  listarPublicas(filtros: { disciplina: string; nivel: string; buscar: string; desde: number }, propias = false): Observable<PaginaPublicaciones> {
    return this.http.get<ApiResponse<PaginaPublicaciones>>(`${this.baseUrl}/publicas${propias ? '/mias' : ''}`, {
      params: { ...filtros },
    }).pipe(map(r => r.data));
  }

  obtenerPublica(id: string, propia = false): Observable<Rutina> {
    return this.http.get<ApiResponse<Rutina>>(`${this.baseUrl}/publicas/${id}${propia ? '/gestion' : ''}`)
      .pipe(map(r => r.data));
  }

  crearPublica(payload: PublicacionPayload): Observable<Rutina> {
    return this.http.post<ApiResponse<Rutina>>(`${this.baseUrl}/publicas`, payload).pipe(map(r => r.data));
  }

  editarPublica(id: string, payload: PublicacionPayload): Observable<Rutina> {
    return this.http.put<ApiResponse<Rutina>>(`${this.baseUrl}/publicas/${id}`, payload).pipe(map(r => r.data));
  }

  cambiarPublicacion(id: string, activa: boolean): Observable<Rutina> {
    return this.http.patch<ApiResponse<Rutina>>(`${this.baseUrl}/publicas/${id}/publicacion`, { activa })
      .pipe(map(r => r.data));
  }

  guardarPublica(id: string): Observable<Rutina> {
    return this.http.post<ApiResponse<Rutina>>(`${this.baseUrl}/publicas/${id}/guardar`, {})
      .pipe(map(r => r.data));
  }

  obtenerDetalle(id: string): Observable<Rutina> {
    return this.http
      .get<ApiResponse<Rutina>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }
}