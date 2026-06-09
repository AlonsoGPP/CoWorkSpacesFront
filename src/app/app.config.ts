import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { authUnauthorizedInterceptor } from './infrastructure/http/auth-unauthorized.interceptor';
import { apiErrorInterceptor } from './infrastructure/http/api-error.interceptor';
import { jwtAuthInterceptor } from './infrastructure/http/jwt-auth.interceptor';
import { INFRASTRUCTURE_PROVIDERS } from './infrastructure/providers/infrastructure.providers';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([jwtAuthInterceptor, authUnauthorizedInterceptor, apiErrorInterceptor])
    ),
    ...INFRASTRUCTURE_PROVIDERS
  ]
};
