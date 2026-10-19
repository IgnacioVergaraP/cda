import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { ActualizarPerfilPayload, User } from '../../../shared/models/user.model';
import { UsuarioResumen } from '../models/usuario.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly baseUrl = `${environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) {}

  obtenerPerfil(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.baseUrl}/perfil`)
      .pipe(map(res => res.data));
  }

  actualizarPerfil(payload: ActualizarPerfilPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.baseUrl}/perfil`, payload)
      .pipe(map(res => res.data));
  }

  obtenerResumen(): Observable<UsuarioResumen> {
    return this.http
      .get<ApiResponse<UsuarioResumen>>(`${this.baseUrl}/resumen`)
      .pipe(map(res => res.data));
  }
}