import { Provider } from '@angular/core';

import { COWORK_REPOSITORY } from '../../application/ports/cowork-repository.port';
import { environment } from '../../../environments/environment';
import { API_BASE_URL } from '../config/api-base-url.token';
import { CoworkHttpRepository } from '../repositories/cowork-http.repository';

export const INFRASTRUCTURE_PROVIDERS: Provider[] = [
  { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
  { provide: COWORK_REPOSITORY, useClass: CoworkHttpRepository }
];
