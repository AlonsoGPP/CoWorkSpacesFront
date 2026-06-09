import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AUTH_SESSION } from '../../application/ports/auth-session.port';
import { API_BASE_URL } from '../config/api-base-url.token';

export const jwtAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AUTH_SESSION);
  const apiBaseUrl = inject(API_BASE_URL).replace(/\/+$/, '');

  if (!request.url.startsWith(apiBaseUrl)) {
    return next(request);
  }

  if (request.url.endsWith('/auth/login')) {
    return next(request);
  }

  const accessToken = authSession.getAccessToken();
  if (accessToken === null) {
    return next(request);
  }

  const authRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return next(authRequest);
};
