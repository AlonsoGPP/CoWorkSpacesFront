import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

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
      label: 'Reportes',
      icon: 'query_stats',
      route: '/reports'
    }
  ];
}
