import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize } from 'rxjs';

import { PricingUseCase } from '../../../application/use-cases/pricing.use-case';
import { SpacesUseCases } from '../../../application/use-cases/spaces.use-cases';
import { PriceQuoteCommand, PricingQuote, Space } from '../../../domain/models/contracts';
import {
  combineDateAndTimeToIso,
  getDefaultDateTimeRange
} from '../../utils/date-time';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-pricing-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPageComponent {
  private readonly pricingUseCase = inject(PricingUseCase);
  private readonly spacesUseCases = inject(SpacesUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultDateTimeRange = getDefaultDateTimeRange(60, 15);

  readonly quote = signal<PricingQuote | null>(null);
  readonly availableSpaces = signal<Space[]>([]);
  readonly isLoadingSpaces = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

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

  readonly displaySpaceOption = (space: string | Space | null): string => {
    if (space === null || space === undefined) {
      return '';
    }

    if (typeof space === 'string') {
      return space;
    }

    return `${space.name} | ${space.status} | ${space.id}`;
  };

  readonly form = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required]),
    start_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.startDate), [
      Validators.required
    ]),
    start_time: this.formBuilder.control(this.defaultDateTimeRange.startTime, [Validators.required]),
    end_date: this.formBuilder.control(new Date(this.defaultDateTimeRange.endDate), [Validators.required]),
    end_time: this.formBuilder.control(this.defaultDateTimeRange.endTime, [Validators.required])
  });

  constructor() {
    this.loadSpaces();
  }

  onSpaceLookupInput(): void {
    this.form.controls.space_id.setValue('');
  }

  onSpaceOptionSelected(space: Space): void {
    this.form.controls.space_id.setValue(space.id);
  }

  quotePrice(): void {
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
      this.errorMessage.set('Las fechas enviadas no son validas');
      return;
    }

    const command: PriceQuoteCommand = {
      space_id: this.form.controls.space_id.value.trim(),
      start_at: startIso,
      end_at: endIso
    };

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.pricingUseCase
      .quoteReservationPrice(command)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (quote: PricingQuote) => this.quote.set(quote),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
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
        next: (spaces: Space[]) => this.availableSpaces.set(spaces),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
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
}
