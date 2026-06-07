import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { ReportsUseCases } from '../../../application/use-cases/reports.use-cases';
import {
  OccupancyBySpaceReport,
  ReportRangeQuery,
  ReservationsByStatusReport,
  RevenueReport
} from '../../../domain/models/contracts';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-reports-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPageComponent {
  private readonly reportsUseCases = inject(ReportsUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly occupancyReport = signal<OccupancyBySpaceReport | null>(null);
  readonly revenueReport = signal<RevenueReport | null>(null);
  readonly statusReport = signal<ReservationsByStatusReport | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    start_at: this.formBuilder.control('', [Validators.required]),
    end_at: this.formBuilder.control('', [Validators.required])
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

    const startIso = this.toIso(this.form.controls.start_at.value);
    const endIso = this.toIso(this.form.controls.end_at.value);
    if (startIso === null || endIso === null) {
      this.errorMessage.set('El rango de fechas no es valido');
      return null;
    }

    return {
      start_at: startIso,
      end_at: endIso
    };
  }

  private toIso(localDateTime: string): string | null {
    const parsedDate = new Date(localDateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  }
}
