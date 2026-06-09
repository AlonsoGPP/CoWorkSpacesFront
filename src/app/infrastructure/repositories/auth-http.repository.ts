import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthRepositoryPort } from '../../application/ports/auth-repository.port';
import { AuthTokenResponse, LoginCommand } from '../../domain/models/contracts';
import { API_BASE_URL } from '../config/api-base-url.token';

@Injectable()
export class AuthHttpRepository implements AuthRepositoryPort {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  login(command: LoginCommand): Observable<AuthTokenResponse> {
    return this.httpClient.post<AuthTokenResponse>(this.buildUrl('/auth/login'), command);
  }

  private buildUrl(path: string): string {
    const normalizedBaseUrl = this.apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}
