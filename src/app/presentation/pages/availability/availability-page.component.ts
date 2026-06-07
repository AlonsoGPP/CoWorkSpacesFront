import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { AvailabilityUseCase } from '../../../application/use-cases/availability.use-case';
import { SpacesUseCases } from '../../../application/use-cases/spaces.use-cases';
import {
  Space,
  SpaceAvailability,
  SpaceAvailabilityQuery,
  SpaceAvailabilityReservationItem
} from '../../../domain/models/contracts';
import { combineDateAndTimeToIso } from '../../utils/date-time';
import { toErrorMessage } from '../../utils/error-message';

interface CalendarHourGuide {
  label: string;
  topPx: number;
}

interface CalendarReservationBlock {
  reservationId: string;
  startLabel: string;
  endLabel: string;
  status: string;
  blocksAvailability: boolean;
  topPx: number;
  heightPx: number;
}

interface CalendarDayColumn {
  key: string;
  label: string;
  blocks: CalendarReservationBlock[];
}

type AvailabilityViewMode = 'calendar' | 'list';

const HOUR_ROW_HEIGHT_PX = 40;
const DAY_HEIGHT_PX = HOUR_ROW_HEIGHT_PX * 24;
const PIXELS_PER_MINUTE = HOUR_ROW_HEIGHT_PX / 60;

@Component({
  selector: 'app-availability-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './availability-page.component.html',
  styleUrl: './availability-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvailabilityPageComponent {
  private readonly availabilityUseCase = inject(AvailabilityUseCase);
  private readonly spacesUseCases = inject(SpacesUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly dayLabelFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });

  readonly availability = signal<SpaceAvailability | null>(null);
  readonly availableSpaces = signal<Space[]>([]);
  readonly isLoadingSpaces = signal<boolean>(false);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly preselectedSpaceId = signal<string | null>(null);
  readonly viewMode = signal<AvailabilityViewMode>('calendar');

  readonly dayHeightPx = DAY_HEIGHT_PX;
  readonly hourGuides: CalendarHourGuide[] = Array.from({ length: 24 }, (_, hour) => ({
    label: `${hour.toString().padStart(2, '0')}:00`,
    topPx: hour * HOUR_ROW_HEIGHT_PX
  }));

  readonly spaceLookupControl = this.formBuilder.control<string | Space>('');

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
      const searchableText = `${space.name} ${space.id}`.toLowerCase();
      return searchableText.includes(filterText);
    });
  });

  readonly calendarDays = computed<CalendarDayColumn[]>(() => {
    const availability = this.availability();
    if (availability === null) {
      return [];
    }

    const rangeStart = new Date(availability.start_at);
    const rangeEnd = new Date(availability.end_at);
    const dayCursor = new Date(rangeStart);
    dayCursor.setHours(0, 0, 0, 0);

    const days: CalendarDayColumn[] = [];

    while (dayCursor < rangeEnd && days.length < 7) {
      const dayStart = new Date(dayCursor);
      const dayEnd = new Date(dayCursor);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const blocks = availability.reservations
        .map((reservation) => this.toDayReservationBlock(reservation, dayStart, dayEnd))
        .filter((block): block is CalendarReservationBlock => block !== null)
        .sort((left, right) => left.topPx - right.topPx);

      days.push({
        key: dayStart.toISOString(),
        label: this.dayLabelFormatter.format(dayStart),
        blocks
      });

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    return days;
  });

  readonly hasMoreCalendarDays = computed(() => {
    const availability = this.availability();
    if (availability === null) {
      return false;
    }

    const start = new Date(availability.start_at);
    const end = new Date(availability.end_at);
    const millis = end.getTime() - start.getTime();
    const days = millis / (24 * 60 * 60 * 1000);
    return days > 7;
  });

  readonly form = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required]),
    start_date: this.formBuilder.control(this.toDateWithTime(8, 0), [Validators.required]),
    start_time: this.formBuilder.control('08:00', [Validators.required]),
    end_date: this.formBuilder.control(this.toDateWithTime(20, 0, 6), [Validators.required]),
    end_time: this.formBuilder.control('20:00', [Validators.required]),
    slot_minutes: this.formBuilder.control(30, [Validators.required, Validators.min(15), Validators.max(120)])
  });

  readonly displaySpaceOption = (space: string | Space | null): string => {
    if (space === null || space === undefined) {
      return '';
    }

    if (typeof space === 'string') {
      return space;
    }

    return `${space.name} | ${space.status} | ${space.id}`;
  };

  constructor() {
    this.listenSpaceSelectionFromRoute();
    this.loadSpaces();
  }

  setViewMode(mode: AvailabilityViewMode): void {
    this.viewMode.set(mode);
  }

  onSpaceLookupInput(): void {
    this.form.controls.space_id.setValue('');
  }

  onSpaceOptionSelected(space: Space): void {
    this.form.controls.space_id.setValue(space.id);
  }

  loadAvailability(): void {
    this.tryResolveSpaceFromLookup();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
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
      this.errorMessage.set('El rango de fechas para disponibilidad es invalido');
      return;
    }

    const query: SpaceAvailabilityQuery = {
      start_at: startIso,
      end_at: endIso,
      slot_minutes: Number(this.form.controls.slot_minutes.value)
    };

    this.errorMessage.set(null);
    this.isLoadingAvailability.set(true);

    this.availabilityUseCase
      .getSpaceAvailability(this.form.controls.space_id.value.trim(), query)
      .pipe(
        finalize(() => this.isLoadingAvailability.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: SpaceAvailability) => this.availability.set(response),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  trackSlot(index: number, slot: { start_at: string }): string {
    return `${index}-${slot.start_at}`;
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

          const selectedSpaceId = this.preselectedSpaceId() ?? this.form.controls.space_id.value;
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
      this.form.controls.space_id.setValue(spaceId);
      return;
    }

    this.spaceLookupControl.setValue(selectedSpace);
    this.form.controls.space_id.setValue(selectedSpace.id);
  }

  private tryResolveSpaceFromLookup(): void {
    if (this.form.controls.space_id.value.trim().length > 0) {
      return;
    }

    const lookupValue = this.spaceLookupControl.value;
    if (typeof lookupValue !== 'string') {
      this.form.controls.space_id.setValue(lookupValue.id);
      return;
    }

    const normalizedLookup = lookupValue.trim().toLowerCase();
    if (normalizedLookup.length === 0) {
      return;
    }

    const exactSpaceById = this.availableSpaces().find(
      (space) => space.id.toLowerCase() === normalizedLookup
    );
    if (exactSpaceById !== undefined) {
      this.form.controls.space_id.setValue(exactSpaceById.id);
      this.spaceLookupControl.setValue(exactSpaceById);
      return;
    }

    const exactSpaceByName = this.availableSpaces().find(
      (space) => space.name.toLowerCase() === normalizedLookup
    );
    if (exactSpaceByName !== undefined) {
      this.form.controls.space_id.setValue(exactSpaceByName.id);
      this.spaceLookupControl.setValue(exactSpaceByName);
    }
  }

  private toDayReservationBlock(
    reservation: SpaceAvailabilityReservationItem,
    dayStart: Date,
    dayEnd: Date
  ): CalendarReservationBlock | null {
    const reservationStart = new Date(reservation.start_at);
    const reservationEnd = new Date(reservation.end_at);

    if (reservationStart >= dayEnd || reservationEnd <= dayStart) {
      return null;
    }

    const segmentStart = reservationStart > dayStart ? reservationStart : dayStart;
    const segmentEnd = reservationEnd < dayEnd ? reservationEnd : dayEnd;

    const startMinutes = segmentStart.getHours() * 60 + segmentStart.getMinutes();
    const endMinutes = segmentEnd.getHours() * 60 + segmentEnd.getMinutes();
    const durationMinutes = Math.max(15, endMinutes - startMinutes);

    return {
      reservationId: reservation.reservation_id,
      startLabel: segmentStart.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      endLabel: segmentEnd.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      status: reservation.status,
      blocksAvailability: reservation.blocks_availability,
      topPx: startMinutes * PIXELS_PER_MINUTE,
      heightPx: Math.max(20, durationMinutes * PIXELS_PER_MINUTE)
    };
  }

  private toDateWithTime(hour: number, minute: number, addDays = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + addDays);
    date.setHours(hour, minute, 0, 0);
    return date;
  }
}
