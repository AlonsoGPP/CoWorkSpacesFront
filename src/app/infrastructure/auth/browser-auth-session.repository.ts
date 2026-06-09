import { Injectable } from '@angular/core';

import { AuthSessionPort } from '../../application/ports/auth-session.port';
import { AuthTokenResponse } from '../../domain/models/contracts';

interface StoredAuthSession {
  access_token: string;
  token_type: string;
  expires_at_epoch_ms: number;
}

@Injectable()
export class BrowserAuthSessionRepository implements AuthSessionPort {
  private readonly storageKey = 'cowork.auth.session';

  saveToken(token: AuthTokenResponse): void {
    const session: StoredAuthSession = {
      access_token: token.access_token,
      token_type: token.token_type,
      expires_at_epoch_ms: Date.now() + token.expires_in_seconds * 1000
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  getAccessToken(): string | null {
    const session = this.readStoredSession();
    if (session === null) {
      return null;
    }

    if (session.expires_at_epoch_ms <= Date.now()) {
      this.clear();
      return null;
    }

    return session.access_token;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private readStoredSession(): StoredAuthSession | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (rawValue === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<StoredAuthSession>;
      if (
        typeof parsed.access_token !== 'string' ||
        typeof parsed.token_type !== 'string' ||
        typeof parsed.expires_at_epoch_ms !== 'number'
      ) {
        return null;
      }

      return {
        access_token: parsed.access_token,
        token_type: parsed.token_type,
        expires_at_epoch_ms: parsed.expires_at_epoch_ms
      };
    } catch {
      return null;
    }
  }
}
