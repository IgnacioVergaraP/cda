import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { EjercicioCatalogo, EjercicioPayload, Pagina, Recurso, RecursoPayload } from '../models/catalogo.model';

interface ApiResponse<T> { data: T; }
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly url = environment.apiUrl;
  constructor(private http: HttpClient) {}
  listar(filtros: { categoria: string; musculo: string; buscar: string; desde: number }): Observable<Pagina<EjercicioCatalogo>> {
    return this.http.get<ApiResponse<Pagina<EjercicioCatalogo>>>(`${this.url}/ejercicios`, { params: { ...filtros } }).pipe(map(r => r.data));
  }
  obtener(id: string): Observable<EjercicioCatalogo> {
    return this.http.get<ApiResponse<EjercicioCatalogo>>(`${this.url}/ejercicios/${id}`).pipe(map(r => r.data));
  }
  guardar(payload: EjercicioPayload, id?: string | null): Observable<EjercicioCatalogo> {
    const solicitud = id ? this.http.put<ApiResponse<EjercicioCatalogo>>(`${this.url}/ejercicios/${id}`, payload)
      : this.http.post<ApiResponse<EjercicioCatalogo>>(`${this.url}/ejercicios`, payload);
    return solicitud.pipe(map(r => r.data));
  }
  recursos(filtros: { tipo: string; buscar: string; desde: number }): Observable<Pagina<Recurso>> {
    return this.http.get<ApiResponse<Pagina<Recurso>>>(`${this.url}/recursos`, { params: { ...filtros } }).pipe(map(r => r.data));
  }
  guardarRecurso(payload: RecursoPayload, id?: string | null): Observable<Recurso> {
    const solicitud = id ? this.http.put<ApiResponse<Recurso>>(`${this.url}/recursos/${id}`, payload)
      : this.http.post<ApiResponse<Recurso>>(`${this.url}/recursos`, payload);
    return solicitud.pipe(map(r => r.data));
  }
}
