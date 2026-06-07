import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize } from 'rxjs';

import { ReportsUseCases } from '../../../application/use-cases/reports.use-cases';
import {
  OccupancyBySpaceReport,
  ReportRangeQuery,
  ReservationsByStatusReport,
  RevenueReport
} from '../../../domain/models/contracts';
import {
  combineDateAndTimeToIso,
  getDefaultDateTimeRange
} from '../../utils/date-time';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-reports-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPageComponent {
  private readonly reportsUseCases = inject(ReportsUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultDateTimeRange = getDefaultDateTimeRange(
    60,
    15,
    new Date(Date.now() - 60 * 60 * 1000)
  );

  readonly occupancyReport = signal<OccupancyBySpaceReport | null>(null);
  readonly revenueReport = signal<RevenueReport | null>(null);
  readonly statusReport = signal<ReservationsByStatusReport | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    start_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.startDate), [
      Validators.required
    ]),
    start_time: this.formBuilder.control(this.defaultDateTimeRange.startTime, [Validators.required]),
    end_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.endDate), [Validators.required]),
    end_time: this.formBuilder.control(this.defaultDateTimeRange.endTime, [Validators.required])
  });

  loadOccupancyReport(): void {
    const query = this.getQueryFromForm();
    if (query === null) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.reportsUseCases
      .getOccupancyBySpaceReport(query)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (report: OccupancyBySpaceReport) => this.occupancyReport.set(report),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  loadRevenueReport(): void {
    const query = this.getQueryFromForm();
    if (query === null) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.reportsUseCases
      .getRevenueReport(query)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (report: RevenueReport) => this.revenueReport.set(report),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  loadStatusReport(): void {
    const query = this.getQueryFromForm();
    if (query === null) {
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.reportsUseCases
      .getReservationsByStatusReport(query)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (report: ReservationsByStatusReport) => this.statusReport.set(report),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  private getQueryFromForm(): ReportRangeQuery | null {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }

    const startIso = combineDateAndTimeToIso(
      this.form.controls.start_date.value,
      this.form.controls.start_time.value
    );
    const endIso = combineDateAndTimeToIso(
      this.form.controls.end_date.value,
      this.form.controls.end_time.value
    );
    if (startIso === null || endIso === null) {
      this.errorMessage.set('El rango de fechas no es valido');
      return null;
    }

    return {
      start_at: startIso,
      end_at: endIso
    };
  }
}
