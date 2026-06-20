# QuestMasters

VTT (Virtual Tabletop) web-based para juegos de rol. El DM humano es el protagonista; la IA actúa como copiloto.

## Stack

| App / Paquete | Tecnología | Puerto local |
|---|---|---|
| `apps/backend` | Hono + Cloudflare Workers (Wrangler) | 3000 |
| `apps/frontend` | React + Vite + TailwindCSS | 3001 |
| `apps/dm-orchestrator` | Python + RunPod Serverless | — |
| `apps/landing` | Astro | — |
| `packages/dnd-rules` | TypeScript puro | — |

Almacenamiento: Cloudflare D1 (SQLite) + R2 (objetos/imágenes). Auth: JWT (HS256) con `jose`.

## Prerequisitos

- [Bun](https://bun.sh) `>= 1.3`
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — instalar globalmente: `bun add -g wrangler`
- Cuenta de Cloudflare y sesión activa: `wrangler login`

## Setup inicial (una sola vez tras clonar)

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar variables locales del backend
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
# El archivo ya incluye valores funcionales para dev local.
# Opcional: cambia JWT_SECRET por cualquier string aleatorio.

# 3. Aplicar migraciones a la base de datos D1 local
cd apps/backend
bunx wrangler d1 migrations apply questmasters --local --env preview
cd ../..
```

## Levantar el proyecto

```bash
bun run dev
```

Levanta backend y frontend en paralelo via Turbo:
- API → `http://127.0.0.1:3000`
- Frontend → `http://localhost:3001`

> Si el puerto 3000 está ocupado, el backend elige el siguiente disponible y avisa en consola.
> En ese caso agrega `VITE_API_URL=http://127.0.0.1:<nuevo-puerto>` a `apps/frontend/.env.local`.

## DM Orchestrator (opcional en dev local)

Corre en RunPod Serverless con el modelo `google/gemma-4-26B-A4B-it`. Para desarrollo local no es necesario — `DM_USE_RUNPOD=false` en `.dev.vars` lo deja en modo stub.

Para activar el endpoint real:
```
DM_USE_RUNPOD=true
RUNPOD_ENDPOINT_ID=<id>
RUNPOD_API_KEY=<key>
```

## Estructura del monorepo

```
questmasters-monorepo/
├── apps/
│   ├── backend/          # API — Hono + Cloudflare Workers + D1 + R2
│   ├── frontend/         # SPA — React + Vite + TailwindCSS
│   ├── dm-orchestrator/  # Orquestador IA — Python + RunPod
│   └── landing/          # Marketing — Astro
├── packages/
│   ├── dnd-rules/        # Lógica de reglas D&D (sin I/O)
└── turbo.json
```
