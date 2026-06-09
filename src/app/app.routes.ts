import { Routes } from '@angular/router';

import { authGuard } from './presentation/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		title: 'Iniciar sesion',
		loadComponent: () =>
			import('./presentation/pages/login/login-page.component').then(
				(module) => module.LoginPageComponent
			)
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'spaces'
	},
	{
		path: 'spaces',
		title: 'Espacios',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./presentation/pages/spaces/spaces-page.component').then(
				(module) => module.SpacesPageComponent
			)
	},
	{
		path: 'reservations',
		title: 'Reservas',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./presentation/pages/reservations/reservations-page.component').then(
				(module) => module.ReservationsPageComponent
			)
	},
	{
		path: 'pricing',
		title: 'Pricing',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./presentation/pages/pricing/pricing-page.component').then(
				(module) => module.PricingPageComponent
			)
	},
	{
		path: 'availability',
		title: 'Disponibilidad',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./presentation/pages/availability/availability-page.component').then(
				(module) => module.AvailabilityPageComponent
			)
	},
	{
		path: 'reports',
		title: 'Reportes',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./presentation/pages/reports/reports-page.component').then(
				(module) => module.ReportsPageComponent
			)
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];
