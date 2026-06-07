import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORK_REPOSITORY, CoworkRepositoryPort } from '../ports/cowork-repository.port';
import { SaveSpaceCommand, Space } from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class SpacesUseCases {
  constructor(@Inject(COWORK_REPOSITORY) private readonly repository: CoworkRepositoryPort) {}

  listSpaces(): Observable<Space[]> {
    return this.repository.listSpaces();
  }

  getSpace(spaceId: string): Observable<Space> {
    return this.repository.getSpace(spaceId);
  }

  createSpace(command: SaveSpaceCommand): Observable<Space> {
    return this.repository.createSpace(command);
  }

  updateSpace(spaceId: string, command: SaveSpaceCommand): Observable<Space> {
    return this.repository.updateSpace(spaceId, command);
  }

  deleteSpace(spaceId: string): Observable<void> {
    return this.repository.deleteSpace(spaceId);
  }
}
