import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Maquina } from '../models/maquina.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class MaquinasService {

  private readonly baseUrl = `${environment.apiUrl}/maquinas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Maquina[]> {
    return this.http
      .get<ApiResponse<Maquina[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  listarPorMusculo(musculo: string): Observable<Maquina[]> {
    const params = new HttpParams().set('musculo', musculo);
    return this.http
      .get<ApiResponse<Maquina[]>>(this.baseUrl, { params })
      .pipe(map(res => res.data));
  }

  obtenerDetalle(id: string): Observable<Maquina> {
    return this.http
      .get<ApiResponse<Maquina>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }
}