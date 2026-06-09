import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthTokenResponse, LoginCommand } from '../../domain/models/contracts';

export interface AuthRepositoryPort {
  login(command: LoginCommand): Observable<AuthTokenResponse>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepositoryPort>('AUTH_REPOSITORY');
