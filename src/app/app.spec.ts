import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AUTH_REPOSITORY } from './application/ports/auth-repository.port';
import { AUTH_SESSION } from './application/ports/auth-session.port';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AUTH_REPOSITORY,
          useValue: {
            login: () =>
              of({
                access_token: 'fake-token',
                token_type: 'bearer',
                expires_in_seconds: 3600
              })
          }
        },
        {
          provide: AUTH_SESSION,
          useValue: {
            saveToken: () => undefined,
            getAccessToken: () => null,
            isAuthenticated: () => false,
            clear: () => undefined
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render application title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-title')?.textContent).toContain('CoWork Reservations Console');
  });
});
