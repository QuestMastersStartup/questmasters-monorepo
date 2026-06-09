# QuestMasters — Reporte de Estado y Arquitectura

> **Última actualización:** 30 de marzo de 2026
> **Stack:** Turborepo · Bun 1.3 · Elysia · TypeORM · PostgreSQL 17 · Supabase Auth · React 19 + Vite (rolldown) + TailwindCSS 3 · Astro (landing)
> **Backlog detallado:** Ver [backlog.md](./backlog.md)

---

## 1. Arquitectura del Proyecto

### 1.1 Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| **Monorepo** | Turborepo + Bun workspaces | Turbo 2.7, Bun 1.3.9 | Workspace root con 3 apps + 5 packages |
| **Runtime** | Bun | 1.3.9 | Runtime y package manager unificado |
| **Backend (API)** | Elysia | 1.2 | Framework HTTP nativo para Bun, CORS, rate limiting, Swagger |
| **ORM** | TypeORM | 0.3.28 | `synchronize: false`, migraciones manuales |
| **Base de datos** | PostgreSQL 17 | Alpine Docker | Local via docker-compose (puerto 5433) |
| **Autenticación** | Supabase Auth | SDK 2.93 | JWT, email/password. OAuth pendiente |
| **Frontend** | React 19 + rolldown-vite | React 19.2, Vite 7.2 | TailwindCSS 3, lucide-react, react-router-dom 7 |
| **Landing** | Astro | — | Sitio estático con TailwindCSS |
| **Shared** | `@questmasters/dnd-rules` | 0.1.0 | Motor de reglas isomorfo, tsup + vitest |

### 1.2 Estructura del Monorepo

```
questmasters-monorepo/
├── apps/
│   ├── backend/              # API — Bun + Elysia + TypeORM
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point: Elysia, CORS, rate limit, Swagger, routes
│   │   │   ├── data-source.ts        # TypeORM DataSource config (CLI migrations)
│   │   │   ├── infrastructure/
│   │   │   │   ├── auth/supabase.ts   # requireUser, requireRole, requireOwnerOrAdmin
│   │   │   │   ├── container.ts       # DI Container manual (repos, use cases, seeders)
│   │   │   │   ├── database.ts        # createDataSource() async
│   │   │   │   └── seed-admin.ts      # Seeder admin user
│   │   │   ├── routes/
│   │   │   │   ├── campaigns.routes.ts  # 12 endpoints: CRUD + members + packs + status + portrait
│   │   │   │   ├── packs.routes.ts      # CRUD content packs
│   │   │   │   ├── assets.routes.ts     # CRUD assets within packs
│   │   │   │   ├── rules.routes.ts      # Motor de reglas endpoints
│   │   │   │   ├── users.routes.ts      # Profile + roles
│   │   │   │   ├── avatar.routes.ts     # Avatar upload
│   │   │   │   ├── username.routes.ts   # Username availability check
│   │   │   │   └── check-email.routes.ts # Email availability check
│   │   │   ├── campaigns/             # DDD module
│   │   │   │   ├── domain/entities/     # Campaign, CampaignMember
│   │   │   │   ├── domain/repositories/ # Interfaces
│   │   │   │   ├── domain/value-objects/ # CampaignStatus
│   │   │   │   ├── application/use-cases/ # 8 use cases
│   │   │   │   ├── infrastructure/typeorm/ # 5 ORM entities + repos
│   │   │   │   └── infrastructure/mappers/ # 2 mappers
│   │   │   ├── content/               # DDD module
│   │   │   │   ├── domain/             # Asset, ContentPack entities + VOs
│   │   │   │   ├── application/         # 14 use cases (CRUD pack, CRUD asset, resolve)
│   │   │   │   └── infrastructure/      # TypeORM + SRD Seeder (39 JSON files)
│   │   │   ├── users/                 # DDD module
│   │   │   │   ├── domain/             # UserProfile entity
│   │   │   │   ├── application/         # 4 use cases
│   │   │   │   └── infrastructure/      # TypeORM + mappers
│   │   │   ├── shared/                # Cross-cutting
│   │   │   │   ├── application/result.ts  # Result<T,E> pattern
│   │   │   │   └── domain/value-objects/  # UUID, Slug VOs
│   │   │   ├── schemas/               # Elysia/TypeBox validation schemas
│   │   │   └── migrations/            # 4 migrations
│   │   ├── test/                    # 2 test files (api, security)
│   │   ├── Dockerfile               # Multi-stage Bun build
│   │   └── package.json
│   ├── frontend/             # React SPA
│   │   ├── src/
│   │   │   ├── pages/               # 12 page components
│   │   │   ├── components/
│   │   │   │   ├── layout/          # AppLayout, Sidebar, ProtectedRoute, AuthActionGuard, GuestBanner
│   │   │   │   └── features/        # campaigns/ (MemberCard, UserSearch), packs/
│   │   │   ├── contexts/            # AuthContext
│   │   │   ├── services/            # api.ts (packs), campaigns.api.ts
│   │   │   ├── hooks/               # useDraftPersistence
│   │   │   ├── lib/                 # supabase, resize-image, dnd-utils, utils
│   │   │   └── router.tsx           # React Router config
│   │   └── vite.config.ts          # Proxy /api → localhost:3000
│   └── landing/              # Astro static site
├── packages/
│   ├── dnd-rules/            # Motor de reglas isomorfo
│   │   └── src/
│   │       ├── types/        # core.types.ts (AssetType, Choice, all asset interfaces)
│   │       │               # prerequisites.types.ts (CharacterState, ValidationContext)
│   │       └── rules/        # resolver.ts, validator.ts + tests
│   ├── eslint-config/        # Shared ESLint config
│   ├── supabase/             # Storage RLS policies SQL
│   ├── typescript-config/    # Shared TS config
│   └── ui/                   # Stub (sin uso real)
├── context/                  # Documentación del proyecto
│   ├── agent-context.md      # Visión estratégica del producto
│   ├── questmasters-req.md   # ESTE ARCHIVO — estado y arquitectura
│   ├── backlog.md            # Backlog detallado con sprints/epics/US
│   └── feedback.md           # Lecciones técnicas aprendidas
├── docker-compose.yml        # PostgreSQL 17 + pgAdmin + API (opcional)
└── turbo.json                # Build pipeline config
```

### 1.3 Base de Datos — Estado Actual

**4 migraciones ejecutadas:**

| # | Migración | Tablas Creadas |
|---|-----------|---------------|
| 1 | `InitialSchema` | `content_packs`, `assets`, `user_profiles` |
| 2 | `AddPackStatus` | Columna `status` en `content_packs` |
| 3 | `CreateCampaigns` | `campaigns`, `campaign_installed_packs` (junction) |
| 4 | `CreateCampaignMembers` | `campaign_members` (PK compuesta: campaign_id + user_id) |

**Tablas actuales:**
- `user_profiles` — id (uuid, matches Supabase Auth), username, avatar_url, bio, role, is_admin
- `content_packs` — id, slug, name, description, type, version, system, author, creator_id, status
- `assets` — id, pack_id (FK), type, index, name, data (jsonb), compatible_with
- `campaigns` — id, name, description, system, cover_image_url, dm_id, status, created_at, updated_at
- `campaign_installed_packs` — campaign_id + pack_id (PK compuesta), installed_at
- `campaign_members` — campaign_id + user_id (PK compuesta), role, joined_at

### 1.4 Autenticación y Seguridad

| Componente | Estado | Detalle |
|-----------|--------|---------|
| Email/Password | ✅ | Supabase Auth con JWT |
| OAuth (Google, Discord) | ⬜ | SDK lo soporta, configuración pendiente |
| Token refresh | ⬜ | No hay `onAuthStateChange` automático |
| `requireUser` | ✅ | Extrae user de header `Authorization: Bearer <token>` |
| `requireRole` | ✅ | Valida roles (admin/creator/player) |
| `requireOwnerOrAdmin` | ✅ | Patrón Fetch-Authorize-Execute |
| Rate limiting | ✅ | 100 req/min global |
| CORS | ✅ | Origins configurables por entorno |

### 1.5 CI/CD

- **GitHub Actions** con 4 jobs paralelos: API, Client, Landing, dnd-rules
- Cada job: `bun install → lint → check-types → test → build`
- ✅ Ya migrado de pnpm a Bun (`oven-sh/setup-bun@v2`)

### 1.6 Dockerfile

- ✅ Multi-stage con Bun (build → runtime)
- Stage 1: `oven/bun:1.2-alpine`, instala deps, `bun run build`
- Stage 2: Solo `dist/` + `package.json`, `bun run start:prod`

---

## 2. Inventario de Funcionalidades Implementadas

### 2.1 Backend — Endpoints Activos

| Módulo | Endpoints | Auth |
|--------|----------|------|
| **Packs** | GET/POST /packs, GET/PUT/DELETE /packs/:slug, PATCH /packs/:slug/status, POST /packs/:slug/suspend | requireAuth + ownership |
| **Assets** | GET/POST /packs/:slug/assets, GET/PUT/DELETE /packs/:slug/assets/:id, POST /packs/:slug/assets/:id/resolve | requireAuth + ownership |
| **Users** | GET/PUT /users/me, PUT /users/:id/role (admin), GET /users/search | requireUser/requireRole |
| **Username** | GET /username/check/:username | Público |
| **Email** | GET /check-email/:email | Público |
| **Avatar** | POST /avatar/upload | requireUser |
| **Campaigns** | GET/POST /campaigns, GET/PUT/DELETE /campaigns/:id, PATCH /:id/status, POST/DELETE /:id/packs | requireUser + ownership |
| **Members** | GET /campaigns/:id/members, POST /:id/members, DELETE /:id/members/:userId | requireUser + DM |
| **Portrait** | POST /campaigns/portrait | requireUser |
| **Rules** | POST /rules/resolve | Público |

### 2.2 Frontend — Páginas y Rutas

| Ruta | Página | Protegida | Funcionalidad |
|------|--------|----------|---------------|
| `/login` | Login | No | Email/password + enlace registro |
| `/register` | Register | No | Registro con validación de username |
| `/profile` | Profile | Sí | Editar username, bio, avatar |
| `/marketplace` | Marketplace | No | Listado de packs públicos |
| `/library` | Library | No | "Mis packs" |
| `/library/create` | CreatePack | Sí | Formulario de creación de pack |
| `/library/:slug` | PackDetails | No | Detalle de pack con assets |
| `/library/:slug/edit` | EditPack | Sí | Edición de pack |
| `/campaigns` | Campaigns | Sí | Listado de mis campañas |
| `/campaigns/create` | CreateCampaign | Sí | Formulario con portrait upload |
| `/campaigns/:id` | CampaignDetails | Sí | Hero, stats, miembros, packs, acciones |
| `/campaigns/:id/edit` | EditCampaign | Sí | Edición de campaña |

### 2.3 `@questmasters/dnd-rules` — Módulos

| Módulo | Funciones/Tipos | Tests |
|--------|----------------|-------|
| `core.types.ts` | AssetType enum (28 tipos), Choice/OptionSet, 10 asset interfaces (Class, Race, Spell, etc.) | — |
| `prerequisites.types.ts` | Prerequisite, CharacterState, ValidationContext, ValidationResult | — |
| `resolver.ts` | `resolveChoice(choice, selectionIds)` → ResolutionResult | 3 tests ✅ |
| `validator.ts` | `validatePrerequisites(prereqs, context)` → ValidationResult (strict/free mode) | 3 tests ✅ |

### 2.4 Backend — Use Cases Implementados

| Módulo | Use Cases | Tests |
|--------|----------|-------|
| **Content/Packs** | CreatePack, GetPack, ListPacks, UpdatePack, SuspendPack, UnsuspendPack, DeletePack, ChangePackStatus | 4 tests |
| **Content/Assets** | CreateAsset, GetAsset, ListAssets, UpdateAsset, DeleteAsset, ResolveAsset | 2 tests |
| **Users** | GetUserProfile, UpdateUserProfile, UpdateUserRole, SearchUsers | 1 test |
| **Campaigns** | CreateCampaign, GetCampaign, ListCampaigns, UpdateCampaign, DeleteCampaign | 0 tests |
| **Members** | InvitePlayer, ListMembers, RemoveMember | 0 tests |

---

## 3. Deudas Técnicas Conocidas

| # | Área | Problema | Severidad |
|---|------|----------|-----------|
| 1 | Tests | Cobertura baja (~10 tests en todo el backend). Use cases de Campaigns sin tests | 🟡 Medio |
| 2 | Frontend | Sin sistema de toasts/notificaciones. Errores se muestran con `alert()` | 🟡 Medio |
| 3 | Auth | Sin refresh token automático (Supabase `onAuthStateChange`) | 🟡 Medio |
| 4 | Auth | Sin OAuth (Google, Discord) | 🟢 Bajo (MVP) |
| 5 | UI | `packages/ui` es un stub sin componentes reales | 🟢 Bajo |
| 6 | Observabilidad | Sin logging estructurado, sin Sentry, sin métricas | 🟡 Medio |
| 7 | Environment | `.env` hardcodeado, sin validación de variables requeridas | 🟢 Bajo |
| 8 | Slug VO | `Slug.fromString` no normaliza vs `Slug.create` — comportamiento inconsistente | 🟢 Bajo |
| 9 | Domain Events | `DomainEvent` base existe pero nunca se despacha | 🟢 Bajo |
| 10 | Frontend API | `api.ts` (packs) no usa `getHeaders()` con token — posibles 401 en rutas protegidas | 🟡 Medio |

---

## 4. Decisiones Arquitectónicas (ADR Log)

| # | Decisión | Contexto | Fecha |
|---|----------|----------|-------|
| ADR-1 | Bun reemplaza Node.js como runtime | Performance nativa, TypeScript sin transpile | 2025 |
| ADR-2 | Elysia reemplaza NestJS | Framework nativo de Bun, más ligero | 2025 |
| ADR-3 | DI manual en `container.ts` | Elysia no tiene DI nativo, inversify agrega complejidad | 2025 |
| ADR-4 | `synchronize: false` + migraciones manuales | Control total, seguro para producción | 2025 |
| ADR-5 | Supabase Auth (no Auth propio) | Ahorro de tiempo, OAuth gratis, RLS en Storage | 2025 |
| ADR-6 | Result<T,E> pattern | Error handling explícito sin excepciones | 2025 |
| ADR-7 | Motor de reglas isomorfo (`dnd-rules`) | Misma lógica en front y back, funciones puras | 2025 |
| ADR-8 | Last-Write-Wins (no CRDTs) para VTT | DM tiene autoridad absoluta, simplifica implementación | Mar 2026 |
| ADR-9 | Point Buy para stats de personajes | Más libertad creativa que Standard Array | Mar 2026 |
| ADR-10 | Personaje muerto = deshabilitado, no borrado | Historial de campaña preservado, índice parcial en DB | Mar 2026 |
