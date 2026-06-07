import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CancelReservationResponse,
  CreateReservationCommand,
  OccupancyBySpaceReport,
  PriceQuoteCommand,
  PricingQuote,
  ReportRangeQuery,
  Reservation,
  ReservationCancellationQuote,
  ReservationsByStatusReport,
  RevenueReport,
  SpaceAvailability,
  SpaceAvailabilityQuery,
  SaveSpaceCommand,
  Space
} from '../../domain/models/contracts';

export interface CoworkRepositoryPort {
  listSpaces(): Observable<Space[]>;
  getSpace(spaceId: string): Observable<Space>;
  createSpace(command: SaveSpaceCommand): Observable<Space>;
  updateSpace(spaceId: string, command: SaveSpaceCommand): Observable<Space>;
  deleteSpace(spaceId: string): Observable<void>;

  listReservationsBySpace(spaceId: string): Observable<Reservation[]>;
  getReservation(reservationId: string): Observable<Reservation>;
  createReservation(command: CreateReservationCommand): Observable<Reservation>;
  cancelReservation(reservationId: string): Observable<CancelReservationResponse>;
  quoteReservationCancellation(reservationId: string): Observable<ReservationCancellationQuote>;

  quoteReservationPrice(command: PriceQuoteCommand): Observable<PricingQuote>;

  getOccupancyBySpaceReport(query: ReportRangeQuery): Observable<OccupancyBySpaceReport>;
  getRevenueReport(query: ReportRangeQuery): Observable<RevenueReport>;
  getReservationsByStatusReport(query: ReportRangeQuery): Observable<ReservationsByStatusReport>;

  getSpaceAvailability(
    spaceId: string,
    query: SpaceAvailabilityQuery
  ): Observable<SpaceAvailability>;
}

export const COWORK_REPOSITORY = new InjectionToken<CoworkRepositoryPort>('COWORK_REPOSITORY');
