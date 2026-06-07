import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORK_REPOSITORY, CoworkRepositoryPort } from '../ports/cowork-repository.port';
import {
  OccupancyBySpaceReport,
  ReportRangeQuery,
  ReservationsByStatusReport,
  RevenueReport
} from '../../domain/models/contracts';

@Injectable({ providedIn: 'root' })
export class ReportsUseCases {
  constructor(@Inject(COWORK_REPOSITORY) private readonly repository: CoworkRepositoryPort) {}

  getOccupancyBySpaceReport(query: ReportRangeQuery): Observable<OccupancyBySpaceReport> {
    return this.repository.getOccupancyBySpaceReport(query);
  }

  getRevenueReport(query: ReportRangeQuery): Observable<RevenueReport> {
    return this.repository.getRevenueReport(query);
  }

  getReservationsByStatusReport(query: ReportRangeQuery): Observable<ReservationsByStatusReport> {
    return this.repository.getReservationsByStatusReport(query);
  }
}
