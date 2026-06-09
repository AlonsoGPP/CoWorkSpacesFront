import { InjectionToken } from '@angular/core';

import { AuthTokenResponse } from '../../domain/models/contracts';

export interface AuthSessionPort {
  saveToken(token: AuthTokenResponse): void;
  getAccessToken(): string | null;
  isAuthenticated(): boolean;
  clear(): void;
}

export const AUTH_SESSION = new InjectionToken<AuthSessionPort>('AUTH_SESSION');
