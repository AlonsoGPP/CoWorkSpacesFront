import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthUseCases } from './application/use-cases/auth.use-cases';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly authUseCases = inject(AuthUseCases);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    {
      label: 'Espacios',
      icon: 'meeting_room',
      route: '/spaces'
    },
    {
      label: 'Reservas',
      icon: 'event_available',
      route: '/reservations'
    },
    {
      label: 'Pricing',
      icon: 'calculate',
      route: '/pricing'
    },
    {
      label: 'Disponibilidad',
      icon: 'calendar_month',
      route: '/availability'
    },
    {
      label: 'Reportes',
      icon: 'query_stats',
      route: '/reports'
    }
  ];

  isAuthenticated(): boolean {
    return this.authUseCases.isAuthenticated();
  }

  logout(): void {
    this.authUseCases.logout();
    void this.router.navigate(['/login']);
  }
}
