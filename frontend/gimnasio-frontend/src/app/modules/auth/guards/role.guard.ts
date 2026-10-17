import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { UserRole } from '../../../shared/models/user.model';
import { AuthService } from '../services/auth.service';

export function roleGuard(rolesPermitidos: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Esperamos a que AuthService termine de restaurar sesión antes de decidir.
    return auth.inicializado$.pipe(
      take(1),
      map(() => {
        if (!auth.estaLogueado) {
          return router.createUrlTree(['/auth']);
        }
        if (auth.tieneRol(...rolesPermitidos)) {
          return true;
        }
        return router.createUrlTree(['/ejercicios']);
      }),
    );
  };
}