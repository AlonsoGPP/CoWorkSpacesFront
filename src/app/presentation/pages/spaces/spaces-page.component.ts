import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { SpacesUseCases } from '../../../application/use-cases/spaces.use-cases';
import { SaveSpaceCommand, SPACE_STATUSES, Space } from '../../../domain/models/contracts';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-spaces-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './spaces-page.component.html',
  styleUrl: './spaces-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpacesPageComponent {
  private readonly spacesUseCases = inject(SpacesUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly statuses = SPACE_STATUSES;
  readonly spaces = signal<Space[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly editingSpaceId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    name: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    status: this.formBuilder.control<(typeof SPACE_STATUSES)[number]>('ACTIVO', [Validators.required]),
    hourly_rate: this.formBuilder.control('100.00', [
      Validators.required,
      Validators.pattern(/^\d+(\.\d{1,2})?$/)
    ]),
    capacity: this.formBuilder.control(4, [Validators.required, Validators.min(1), Validators.max(500)])
  });

  constructor() {
    this.loadSpaces();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const command: SaveSpaceCommand = {
      name: this.form.controls.name.value.trim(),
      status: this.form.controls.status.value,
      hourly_rate: this.form.controls.hourly_rate.value.trim(),
      capacity: Number(this.form.controls.capacity.value)
    };

    if (command.name.length === 0) {
      this.errorMessage.set('El nombre del espacio es obligatorio');
      return;
    }

    const spaceId = this.editingSpaceId();
    const action$ = spaceId
      ? this.spacesUseCases.updateSpace(spaceId, command)
      : this.spacesUseCases.createSpace(command);

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    action$
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadSpaces();
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  startEdit(space: Space): void {
    this.editingSpaceId.set(space.id);
    this.form.setValue({
      name: space.name,
      status: space.status,
      hourly_rate: space.hourly_rate,
      capacity: space.capacity
    });
    this.errorMessage.set(null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteSpace(spaceId: string): void {
    const shouldDelete = confirm('Esta accion eliminara el espacio. Deseas continuar?');
    if (!shouldDelete) {
      return;
    }

    this.errorMessage.set(null);

    this.spacesUseCases
      .deleteSpace(spaceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.editingSpaceId() === spaceId) {
            this.resetForm();
          }
          this.loadSpaces();
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  createReservationForSpace(spaceId: string): void {
    void this.router.navigate(['/reservations'], {
      queryParams: {
        spaceId
      }
    });
  }

  viewAvailabilityForSpace(spaceId: string): void {
    void this.router.navigate(['/availability'], {
      queryParams: {
        spaceId
      }
    });
  }

  private loadSpaces(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.spacesUseCases
      .listSpaces()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (spaces: Space[]) => this.spaces.set(spaces),
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }

  private resetForm(): void {
    this.editingSpaceId.set(null);
    this.form.reset({
      name: '',
      status: 'ACTIVO',
      hourly_rate: '100.00',
      capacity: 4
    });
    this.errorMessage.set(null);
  }
}
