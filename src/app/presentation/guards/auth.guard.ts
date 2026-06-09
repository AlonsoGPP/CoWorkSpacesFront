import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthUseCases } from '../../application/use-cases/auth.use-cases';

export const authGuard: CanActivateFn = () => {
  const authUseCases = inject(AuthUseCases);
  const router = inject(Router);

  if (authUseCases.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
