import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORK_REPOSITORY, CoworkRepositoryPort } from '../ports/cowork-repository.port';
import { SpaceAvailability, SpaceAvailabilityQuery } from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class AvailabilityUseCase {
  constructor(@Inject(COWORK_REPOSITORY) private readonly repository: CoworkRepositoryPort) {}

  getSpaceAvailability(spaceId: string, query: SpaceAvailabilityQuery): Observable<SpaceAvailability> {
    return this.repository.getSpaceAvailability(spaceId, query);
  }
}
