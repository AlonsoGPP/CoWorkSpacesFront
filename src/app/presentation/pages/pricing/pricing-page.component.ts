import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { PricingUseCase } from '../../../application/use-cases/pricing.use-case';
import { PriceQuoteCommand, PricingQuote } from '../../../domain/models/contracts';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-pricing-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPageComponent {
  private readonly pricingUseCase = inject(PricingUseCase);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly quote = signal<PricingQuote | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    space_id: this.formBuilder.control('', [Validators.required]),
    start_at: this.formBuilder.control('', [Validators.required]),
    end_at: this.formBuilder.control('', [Validators.required])
  });

  quotePrice(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const startIso = this.toIso(this.form.controls.start_at.value);
    const endIso = this.toIso(this.form.controls.end_at.value);
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

  private toIso(localDateTime: string): string | null {
    const parsedDate = new Date(localDateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  }
}
