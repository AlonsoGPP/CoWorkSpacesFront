import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORK_REPOSITORY, CoworkRepositoryPort } from '../ports/cowork-repository.port';
import {
  CancelReservationResponse,
  CreateReservationCommand,
  Reservation,
  ReservationCancellationQuote
} from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class ReservationsUseCases {
  constructor(@Inject(COWORK_REPOSITORY) private readonly repository: CoworkRepositoryPort) {}

  listReservationsBySpace(spaceId: string): Observable<Reservation[]> {
    return this.repository.listReservationsBySpace(spaceId);
  }

  getReservation(reservationId: string): Observable<Reservation> {
    return this.repository.getReservation(reservationId);
  }

  createReservation(command: CreateReservationCommand): Observable<Reservation> {
    return this.repository.createReservation(command);
  }

  cancelReservation(reservationId: string): Observable<CancelReservationResponse> {
    return this.repository.cancelReservation(reservationId);
  }

  quoteReservationCancellation(reservationId: string): Observable<ReservationCancellationQuote> {
    return this.repository.quoteReservationCancellation(reservationId);
  }
}
