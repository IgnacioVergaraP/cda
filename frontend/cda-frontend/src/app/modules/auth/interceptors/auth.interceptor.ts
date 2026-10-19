import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);

  // No tocamos requests a Supabase directamente.
  // Solo agregamos el token a nuestras llamadas al backend Flask.
  const esLlamadaANuestroBackend = req.url.includes('/api/');
  const esAuthEndpointDeSupabase = req.url.includes('/auth/v1/');

  if (!esLlamadaANuestroBackend || esAuthEndpointDeSupabase) {
    return next(req);
  }

  const token = auth.accessToken;
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const autenticada = req.clone({ setHeaders: headers });

  return next(autenticada).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 en endpoints nuestros → cerrar sesión
      if (err.status === 401 && esLlamadaANuestroBackend) {
        auth.logout(true);
      }
      return throwError(() => err);
    }),
  );
};