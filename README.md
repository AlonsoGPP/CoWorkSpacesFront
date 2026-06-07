# Frontend CoWork Reservations

Aplicacion Angular para consumir el backend FastAPI del sistema de reservas.

## Stack

- Angular 20
- TypeScript strict
- Standalone Components
- Angular Material
- Reactive Forms

## Arquitectura Frontend

El frontend respeta separacion por capas para mantener bajo acoplamiento:

- `src/app/domain`: tipos, contratos de datos y errores.
- `src/app/application`: puertos y casos de uso.
- `src/app/infrastructure`: implementacion HTTP, interceptor y providers.
- `src/app/presentation`: paginas, layout y utilidades de UI.

## Modulos funcionales implementados

- Espacios (`/spaces`): crear, editar, listar y eliminar.
- Reservas (`/reservations`): crear, consultar por espacio e id, cotizar cancelacion y cancelar.
- Pricing (`/pricing`): cotizar precio de reserva.
- Reportes (`/reports`): ocupacion, revenue y reservas por estado.

## Configuracion de API

El backend base URL se define por environment:

- Desarrollo: `src/environments/environment.development.ts`
- Produccion: `src/environments/environment.ts`

Variable actual:

- `apiBaseUrl: 'http://localhost:8000'`

## Levantar en local

Instalar dependencias:

```bash
npm install
```

Iniciar frontend:

```bash
npm start
```

Build de produccion:

```bash
npm run build
```

Tests:

```bash
npm run test -- --watch=false --browsers=ChromeHeadless
```

## Contrato de errores

Se implemento interceptor global para normalizar errores backend:

- Mantiene `error_code`
- Expone `status`, `message` y `details`
- Permite manejo uniforme en UI
