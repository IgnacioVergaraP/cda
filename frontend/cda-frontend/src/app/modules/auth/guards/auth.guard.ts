import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.inicializado$.pipe(
    take(1),
    map(() => {
      if (auth.estaLogueado) return true;
      if (auth.tieneToken) return true;
      return router.createUrlTree(['/auth'], {
        queryParams: { redirect: state.url },
      });
    }),
  );
};