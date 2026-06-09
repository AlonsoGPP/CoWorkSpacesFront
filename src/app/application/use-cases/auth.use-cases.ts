import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AUTH_REPOSITORY, AuthRepositoryPort } from '../ports/auth-repository.port';
import { AUTH_SESSION, AuthSessionPort } from '../ports/auth-session.port';
import { AuthTokenResponse, LoginCommand } from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class AuthUseCases {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(AUTH_SESSION) private readonly authSession: AuthSessionPort
  ) {}

  login(command: LoginCommand): Observable<AuthTokenResponse> {
    return this.authRepository.login(command).pipe(
      tap((token: AuthTokenResponse) => this.authSession.saveToken(token))
    );
  }

  logout(): void {
    this.authSession.clear();
  }

  isAuthenticated(): boolean {
    return this.authSession.isAuthenticated();
  }
}
