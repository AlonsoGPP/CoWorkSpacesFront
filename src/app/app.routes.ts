import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'spaces'
	},
	{
		path: 'spaces',
		title: 'Espacios',
		loadComponent: () =>
			import('./presentation/pages/spaces/spaces-page.component').then(
				(module) => module.SpacesPageComponent
			)
	},
	{
		path: 'reservations',
		title: 'Reservas',
		loadComponent: () =>
			import('./presentation/pages/reservations/reservations-page.component').then(
				(module) => module.ReservationsPageComponent
			)
	},
	{
		path: 'pricing',
		title: 'Pricing',
		loadComponent: () =>
			import('./presentation/pages/pricing/pricing-page.component').then(
				(module) => module.PricingPageComponent
			)
	},
	{
		path: 'availability',
		title: 'Disponibilidad',
		loadComponent: () =>
			import('./presentation/pages/availability/availability-page.component').then(
				(module) => module.AvailabilityPageComponent
			)
	},
	{
		path: 'reports',
		title: 'Reportes',
		loadComponent: () =>
			import('./presentation/pages/reports/reports-page.component').then(
				(module) => module.ReportsPageComponent
			)
	},
	{
		path: '**',
		redirectTo: 'spaces'
	}
];
