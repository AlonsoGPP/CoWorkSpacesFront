import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { ReservationsUseCases } from '../../../application/use-cases/reservations.use-cases';
import {
  CreateReservationCommand,
  Reservation,
  ReservationCancellationQuote
} from '../../../domain/models/contracts';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-reservations-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './reservations-page.component.html',
  styleUrl: './reservations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationsPageComponent {
  private readonly reservationsUseCases = inject(ReservationsUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly reservations = signal<Reservation[]>([]);
  readonly selectedReservation = signal<Reservation | null>(null);
  readonly cancellationQuotes = signal<Record<string, ReservationCancellationQuote>>({});
  readonly lastRefund = signal<{ reservationId: string; refundAmount: string } | null>(null);
  readonly isWorking = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly createForm = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required]),
    start_at: this.formBuilder.control('', [Validators.required]),
    end_at: this.formBuilder.control('', [Validators.required])
  });

  readonly bySpaceForm = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required])
  });

  readonly byIdForm = this.formBuilder.group({
    reservation_id: this.formBuilder.control('', [Validators.required])
  });

  createReservation(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const startIso = this.toIso(this.createForm.controls.start_at.value);
    const endIso = this.toIso(this.createForm.controls.end_at.value);

    if (startIso === null || endIso === null) {
      this.errorMessage.set('Las fechas de la reserva no tienen un formato valido');
      return;
    }

    const command: CreateReservationCommand = {
      space_id: this.createForm.controls.space_id.value.trim(),
      start_at: startIso,
      end_at: endIso
    };

    this.errorMessage.set(null);
    this.isWorking.set(true);

    this.reservationsUseCases
      .createReservation(command)
      .pipe(
        finalize(() => this.isWorking.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (reservation: Reservation) => {
          this.bySpaceForm.controls.space_id.setValue(reservation.space_id);
          this.selectedReservation.set(reservation);
          this.lastRefund.set(null);
          this.loadReservationsBySpace(reservation.space_id);
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  loadReservationsBySpace(spaceIdFromAction?: string): void {
    const spaceId = (spaceIdFromAction ?? this.bySpaceForm.controls.space_id.value).trim();
    if (spaceId.length === 0) {
      this.bySpaceForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isWorking.set(true);

    this.reservationsUseCases
      .listReservationsBySpace(spaceId)
      .pipe(
        finalize(() => this.isWorking.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (reservations: Reservation[]) => {
          this.reservations.set(reservations);
          if (reservations.length > 0) {
            this.selectedReservation.set(reservations[0]);
          }
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  loadReservationById(): void {
    if (this.byIdForm.invalid) {
      this.byIdForm.markAllAsTouched();
      return;
    }

    const reservationId = this.byIdForm.controls.reservation_id.value.trim();

    this.errorMessage.set(null);
    this.isWorking.set(true);

    this.reservationsUseCases
      .getReservation(reservationId)
      .pipe(
        finalize(() => this.isWorking.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (reservation: Reservation) => this.selectedReservation.set(reservation),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  quoteCancellation(reservationId: string): void {
    this.errorMessage.set(null);
    this.isWorking.set(true);

    this.reservationsUseCases
      .quoteReservationCancellation(reservationId)
      .pipe(
        finalize(() => this.isWorking.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (quote: ReservationCancellationQuote) => {
          this.cancellationQuotes.update((current) => ({
            ...current,
            [quote.reservation_id]: quote
          }));
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  cancelReservation(reservationId: string): void {
    const shouldCancel = confirm('Se cancelara esta reserva. Quieres continuar?');
    if (!shouldCancel) {
      return;
    }

    this.errorMessage.set(null);
    this.isWorking.set(true);

    this.reservationsUseCases
      .cancelReservation(reservationId)
      .pipe(
        finalize(() => this.isWorking.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.lastRefund.set({
            reservationId: response.reservation.id,
            refundAmount: response.refund_amount
          });

          this.reservations.update((current) =>
            current.map((reservation) =>
              reservation.id === response.reservation.id ? response.reservation : reservation
            )
          );

          if (this.selectedReservation()?.id === response.reservation.id) {
            this.selectedReservation.set(response.reservation);
          }
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  selectReservation(reservation: Reservation): void {
    this.selectedReservation.set(reservation);
  }

  quoteFor(reservationId: string): ReservationCancellationQuote | null {
    return this.cancellationQuotes()[reservationId] ?? null;
  }

  private toIso(localDateTime: string): string | null {
    const parsedDate = new Date(localDateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  }
}
