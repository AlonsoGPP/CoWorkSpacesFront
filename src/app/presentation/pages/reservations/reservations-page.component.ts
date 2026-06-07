import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { ReservationsUseCases } from '../../../application/use-cases/reservations.use-cases';
import { SpacesUseCases } from '../../../application/use-cases/spaces.use-cases';
import {
  CreateReservationCommand,
  Reservation,
  ReservationCancellationQuote,
  Space
} from '../../../domain/models/contracts';
import {
  combineDateAndTimeToIso,
  getDefaultDateTimeRange
} from '../../utils/date-time';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-reservations-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './reservations-page.component.html',
  styleUrl: './reservations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationsPageComponent {
  private readonly reservationsUseCases = inject(ReservationsUseCases);
  private readonly spacesUseCases = inject(SpacesUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly defaultDateTimeRange = getDefaultDateTimeRange(60, 15);

  readonly reservations = signal<Reservation[]>([]);
  readonly availableSpaces = signal<Space[]>([]);
  readonly isLoadingSpaces = signal<boolean>(false);
  readonly preselectedSpaceId = signal<string | null>(null);
  readonly selectedReservation = signal<Reservation | null>(null);
  readonly cancellationQuotes = signal<Record<string, ReservationCancellationQuote>>({});
  readonly lastRefund = signal<{ reservationId: string; refundAmount: string } | null>(null);
  readonly isWorking = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly spaceLookupControl = this.formBuilder.control<string | Space>('');

  readonly displaySpaceOption = (space: string | Space | null): string => {
    if (space === null || space === undefined) {
      return '';
    }

    if (typeof space === 'string') {
      return space;
    }

    return `${space.name} | ${space.status} | ${space.id}`;
  };

  readonly filteredSpaces = computed(() => {
    const lookupValue = this.spaceLookupControl.value;
    const filterText =
      typeof lookupValue === 'string'
        ? lookupValue.trim().toLowerCase()
        : `${lookupValue.name} ${lookupValue.id}`.toLowerCase();

    const spaces = this.availableSpaces();

    if (filterText.length === 0) {
      return spaces;
    }

    return spaces.filter((space) => {
      const searchable = `${space.name} ${space.id}`.toLowerCase();
      return searchable.includes(filterText);
    });
  });

  readonly createForm = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required]),
    start_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.startDate), [
      Validators.required
    ]),
    start_time: this.formBuilder.control(this.defaultDateTimeRange.startTime, [Validators.required]),
    end_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.endDate), [Validators.required]),
    end_time: this.formBuilder.control(this.defaultDateTimeRange.endTime, [Validators.required])
  });

  readonly bySpaceForm = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required])
  });

  readonly byIdForm = this.formBuilder.group({
    reservation_id: this.formBuilder.control('', [Validators.required])
  });

  constructor() {
    this.listenSpaceSelectionFromRoute();
    this.loadSpaces();
  }

  onSpaceLookupInput(): void {
    this.createForm.controls.space_id.setValue('');
  }

  onSpaceOptionSelected(space: Space): void {
    this.applySelectedSpace(space);
  }

  createReservation(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const startIso = combineDateAndTimeToIso(
      this.createForm.controls.start_date.value,
      this.createForm.controls.start_time.value
    );
    const endIso = combineDateAndTimeToIso(
      this.createForm.controls.end_date.value,
      this.createForm.controls.end_time.value
    );

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

  private listenSpaceSelectionFromRoute(): void {
    this.activatedRoute.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const spaceId = params.get('spaceId');
      if (spaceId === null || spaceId.trim().length === 0) {
        return;
      }

      const normalizedSpaceId = spaceId.trim();
      this.preselectedSpaceId.set(normalizedSpaceId);
      this.tryApplySpaceById(normalizedSpaceId);
    });
  }

  private loadSpaces(): void {
    this.isLoadingSpaces.set(true);

    this.spacesUseCases
      .listSpaces()
      .pipe(
        finalize(() => this.isLoadingSpaces.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (spaces: Space[]) => {
          this.availableSpaces.set(spaces);

          const selectedSpaceId = this.preselectedSpaceId() ?? this.createForm.controls.space_id.value;
          if (selectedSpaceId.trim().length > 0) {
            this.tryApplySpaceById(selectedSpaceId);
          }
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  private tryApplySpaceById(spaceId: string): void {
    const selectedSpace = this.availableSpaces().find((space) => space.id === spaceId);
    if (selectedSpace === undefined) {
      this.spaceLookupControl.setValue(spaceId);
      this.createForm.controls.space_id.setValue(spaceId);
      this.bySpaceForm.controls.space_id.setValue(spaceId);
      return;
    }

    this.spaceLookupControl.setValue(selectedSpace);
    this.applySelectedSpace(selectedSpace);
  }

  private applySelectedSpace(space: Space): void {
    this.createForm.controls.space_id.setValue(space.id);
    this.bySpaceForm.controls.space_id.setValue(space.id);
  }
}
