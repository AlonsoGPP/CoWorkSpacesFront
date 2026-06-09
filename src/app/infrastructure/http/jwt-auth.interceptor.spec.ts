import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AUTH_SESSION, AuthSessionPort } from '../../application/ports/auth-session.port';
import { API_BASE_URL } from '../config/api-base-url.token';

import { jwtAuthInterceptor } from './jwt-auth.interceptor';

describe('jwtAuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let accessToken: string | null;

  const authSessionStub: AuthSessionPort = {
    saveToken: () => undefined,
    getAccessToken: () => accessToken,
    isAuthenticated: () => accessToken !== null,
    clear: () => {
      accessToken = null;
    }
  };

  beforeEach(() => {
    accessToken = 'jwt-token';

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([jwtAuthInterceptor])),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:8000'
        },
        {
          provide: AUTH_SESSION,
          useValue: authSessionStub
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('adds Authorization header for protected API requests', () => {
    httpClient.get('http://localhost:8000/spaces').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8000/spaces');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');

    request.flush([]);
  });

  it('does not add Authorization header for login endpoint', () => {
    httpClient
      .post('http://localhost:8000/auth/login', {
        email: 'admin@cowork.local',
        password: 'Admin123!'
      })
      .subscribe();

    const request = httpTestingController.expectOne('http://localhost:8000/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();

    request.flush({
      access_token: 'new-token',
      token_type: 'bearer',
      expires_in_seconds: 3600
    });
  });
});
