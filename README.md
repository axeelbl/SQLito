# Virtual REC API

API REST para gestionar usuarios, tiendas, productos y pedidos de Virtual REC. Está construida con Express y SQLite.

## Requisitos

- Node.js 20.17 o posterior
- npm 10 o posterior

## Puesta en marcha

```bash
npm ci
cp .env.example .env
npm start
```

Antes de arrancar, sustituye los valores de ejemplo de `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores aleatorios distintos de al menos 32 caracteres. La API escucha en `http://localhost:3000` por defecto.

La base de datos se crea en `database.sqlite` al realizar la primera operación que la necesita. Puede cambiarse con `DATABASE_PATH`. Los archivos SQLite y `.env` son locales y no se versionan.

### Administrador inicial opcional

No existe ninguna contraseña predeterminada. Para crear un administrador durante el primer arranque, define `BOOTSTRAP_ADMIN_PASSWORD` con al menos 12 caracteres y, opcionalmente, las demás variables `BOOTSTRAP_ADMIN_*` de `.env.example`. Después de comprobar que la cuenta existe, elimina la contraseña de bootstrap de `.env`.

## Configuración

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP; por defecto `3000`. |
| `DATABASE_PATH` | No | Ruta del archivo SQLite. |
| `JWT_SECRET` | Sí | Firma de tokens de acceso; mínimo 32 caracteres. |
| `JWT_REFRESH_SECRET` | Sí | Firma de tokens de renovación; mínimo 32 caracteres. |
| `CORS_ORIGINS` | No | Orígenes permitidos separados por comas. Vacío desactiva CORS. |
| `BOOTSTRAP_ADMIN_*` | No | Datos para crear explícitamente el primer administrador. |

## Endpoints principales

- `GET /health`: estado del servicio.
- `GET /api/docs`: catálogo básico de endpoints.
- `POST /api/auth/login` y `POST /api/auth/refresh`: autenticación.
- `/api/users`: registro y administración de usuarios.
- `/api/shops`: tiendas.
- `/api/products`: productos.
- `/api/orders`: pedidos.

Las operaciones privadas requieren `Authorization: Bearer <token>`. El listado completo de usuarios y pedidos está limitado a administradores. `requests.http` contiene peticiones locales de ejemplo; usa únicamente datos sintéticos.

## Calidad y seguridad

```bash
npm run check
npm test
npm audit
npm audit --omit=dev
```

La integración continua repite una instalación limpia, revisa sintaxis, pruebas, dependencias de producción y desarrollo, y evita que se versionen bases de datos o archivos de entorno.

## Notas sobre SQLite

El esquema se inicializa automáticamente para instalaciones nuevas. Este proyecto todavía no incluye un sistema de migraciones: si conservas una base creada por una versión anterior, haz una copia de seguridad y migra sus datos antes de usar el esquema actual.

## Licencia

MIT
