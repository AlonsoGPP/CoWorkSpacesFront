import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AUTH_SESSION } from '../../application/ports/auth-session.port';
import { isAppHttpError } from '../../domain/errors/app-http-error';

function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 401;
  }

  if (isAppHttpError(error)) {
    return error.status === 401;
  }

  return false;
}

export const authUnauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AUTH_SESSION);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const isAuthLoginRequest = request.url.endsWith('/auth/login');
      if (!isAuthLoginRequest && isUnauthorizedError(error)) {
        authSession.clear();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
