import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CoworkRepositoryPort } from '../../application/ports/cowork-repository.port';
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
  SaveSpaceCommand,
  Space
} from '../../domain/models/contracts';
import { API_BASE_URL } from '../config/api-base-url.token';

@Injectable()
export class CoworkHttpRepository implements CoworkRepositoryPort {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  listSpaces(): Observable<Space[]> {
    return this.httpClient.get<Space[]>(this.buildUrl('/spaces'));
  }

  getSpace(spaceId: string): Observable<Space> {
    return this.httpClient.get<Space>(this.buildUrl(`/spaces/${spaceId}`));
  }

  createSpace(command: SaveSpaceCommand): Observable<Space> {
    return this.httpClient.post<Space>(this.buildUrl('/spaces'), command);
  }

  updateSpace(spaceId: string, command: SaveSpaceCommand): Observable<Space> {
    return this.httpClient.put<Space>(this.buildUrl(`/spaces/${spaceId}`), command);
  }

  deleteSpace(spaceId: string): Observable<void> {
    return this.httpClient.delete<void>(this.buildUrl(`/spaces/${spaceId}`));
  }

  listReservationsBySpace(spaceId: string): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(this.buildUrl(`/reservations/by-space/${spaceId}`));
  }

  getReservation(reservationId: string): Observable<Reservation> {
    return this.httpClient.get<Reservation>(this.buildUrl(`/reservations/${reservationId}`));
  }

  createReservation(command: CreateReservationCommand): Observable<Reservation> {
    return this.httpClient.post<Reservation>(this.buildUrl('/reservations'), command);
  }

  cancelReservation(reservationId: string): Observable<CancelReservationResponse> {
    return this.httpClient.post<CancelReservationResponse>(
      this.buildUrl(`/reservations/${reservationId}/cancel`),
      {}
    );
  }

  quoteReservationCancellation(reservationId: string): Observable<ReservationCancellationQuote> {
    return this.httpClient.get<ReservationCancellationQuote>(
      this.buildUrl(`/reservations/${reservationId}/cancellation-quote`)
    );
  }

  quoteReservationPrice(command: PriceQuoteCommand): Observable<PricingQuote> {
    return this.httpClient.post<PricingQuote>(this.buildUrl('/pricing/quote'), command);
  }

  getOccupancyBySpaceReport(query: ReportRangeQuery): Observable<OccupancyBySpaceReport> {
    return this.httpClient.get<OccupancyBySpaceReport>(this.buildUrl('/reports/occupancy-by-space'), {
      params: this.buildRangeParams(query)
    });
  }

  getRevenueReport(query: ReportRangeQuery): Observable<RevenueReport> {
    return this.httpClient.get<RevenueReport>(this.buildUrl('/reports/revenue'), {
      params: this.buildRangeParams(query)
    });
  }

  getReservationsByStatusReport(query: ReportRangeQuery): Observable<ReservationsByStatusReport> {
    return this.httpClient.get<ReservationsByStatusReport>(
      this.buildUrl('/reports/reservations-by-status'),
      {
        params: this.buildRangeParams(query)
      }
    );
  }

  private buildUrl(path: string): string {
    const normalizedBaseUrl = this.apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  private buildRangeParams(query: ReportRangeQuery): HttpParams {
    return new HttpParams().set('start_at', query.start_at).set('end_at', query.end_at);
  }
}
