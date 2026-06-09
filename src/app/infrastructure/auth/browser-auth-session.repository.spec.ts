import { AuthTokenResponse } from '../../domain/models/contracts';

import { BrowserAuthSessionRepository } from './browser-auth-session.repository';

function buildTokenResponse(expiresInSeconds: number): AuthTokenResponse {
  return {
    access_token: 'jwt-token',
    token_type: 'bearer',
    expires_in_seconds: expiresInSeconds
  };
}

describe('BrowserAuthSessionRepository', () => {
  let repository: BrowserAuthSessionRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new BrowserAuthSessionRepository();
  });

  it('stores and retrieves an active access token', () => {
    const dateNowSpy = spyOn(Date, 'now').and.returnValue(1_000);

    repository.saveToken(buildTokenResponse(120));

    dateNowSpy.and.returnValue(2_000);

    expect(repository.getAccessToken()).toBe('jwt-token');
    expect(repository.isAuthenticated()).toBeTrue();
  });

  it('clears session when the token is expired', () => {
    const dateNowSpy = spyOn(Date, 'now').and.returnValue(1_000);

    repository.saveToken(buildTokenResponse(1));

    dateNowSpy.and.returnValue(2_500);

    expect(repository.getAccessToken()).toBeNull();
    expect(repository.isAuthenticated()).toBeFalse();
  });
});
