import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORK_REPOSITORY, CoworkRepositoryPort } from '../ports/cowork-repository.port';
import { PriceQuoteCommand, PricingQuote } from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class PricingUseCase {
  constructor(@Inject(COWORK_REPOSITORY) private readonly repository: CoworkRepositoryPort) {}

  quoteReservationPrice(command: PriceQuoteCommand): Observable<PricingQuote> {
    return this.repository.quoteReservationPrice(command);
  }
}
