import { Provider } from '@angular/core';

import { AUTH_REPOSITORY } from '../../application/ports/auth-repository.port';
import { AUTH_SESSION } from '../../application/ports/auth-session.port';
import { COWORK_REPOSITORY } from '../../application/ports/cowork-repository.port';
import { environment } from '../../../environments/environment';
import { API_BASE_URL } from '../config/api-base-url.token';
import { BrowserAuthSessionRepository } from '../auth/browser-auth-session.repository';
import { AuthHttpRepository } from '../repositories/auth-http.repository';
import { CoworkHttpRepository } from '../repositories/cowork-http.repository';

export const INFRASTRUCTURE_PROVIDERS: Provider[] = [
  { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
  { provide: AUTH_REPOSITORY, useClass: AuthHttpRepository },
  { provide: AUTH_SESSION, useClass: BrowserAuthSessionRepository },
  { provide: COWORK_REPOSITORY, useClass: CoworkHttpRepository }
];
