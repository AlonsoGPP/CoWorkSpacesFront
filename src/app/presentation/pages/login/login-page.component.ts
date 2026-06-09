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
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthUseCases } from '../../../application/use-cases/auth.use-cases';
import { LoginCommand } from '../../../domain/models/contracts';
import { toErrorMessage } from '../../utils/error-message';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly authUseCases = inject(AuthUseCases);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    email: this.formBuilder.control('admin@cowork.local', [Validators.required, Validators.email]),
    password: this.formBuilder.control('Admin123!', [Validators.required, Validators.minLength(1)])
  });

  constructor() {
    if (this.authUseCases.isAuthenticated()) {
      void this.router.navigate(['/spaces']);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const command: LoginCommand = {
      email: this.form.controls.email.value.trim(),
      password: this.form.controls.password.value
    };

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authUseCases
      .login(command)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/spaces']);
        },
        error: (error: unknown) => this.errorMessage.set(toErrorMessage(error))
      });
  }
}
