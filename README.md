# QuestMasters

VTT (Virtual Tabletop) web-based para juegos de rol. El DM humano es el protagonista; la IA actúa como copiloto.

## Stack

| App / Paquete | Tecnología | Puerto local |
|---|---|---|
| `apps/backend` | Hono + Cloudflare Workers (Wrangler) | 3000 |
| `apps/frontend` | React + Vite + TailwindCSS | 3001 |
| `apps/dm-orchestrator` | Python + Google Colab / RunPod | — |
| `apps/landing` | Astro | 3002 |
| `packages/dnd-rules` | TypeScript puro (lógica de reglas D&D) | — |

Almacenamiento: Cloudflare D1 (SQLite) + R2 (objetos/imágenes). Auth: JWT (HS256) con `jose`.

## Setup completo (primera vez)

### 1. Instalar herramientas

```bash
# Instalar Bun (runtime y package manager)
curl -fsSL https://bun.sh/install | bash

# Instalar Wrangler (CLI de Cloudflare Workers)
bun add -g wrangler

# Autenticarse con Cloudflare (abre el navegador, solo una vez)
wrangler login
```

### 2. Clonar e instalar dependencias

```bash
git clone https://github.com/QuestMastersStartup/questmasters-monorepo.git
cd questmasters-monorepo
bun install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y rellena los valores reales. Pide las credenciales al líder del equipo.
El script de dev del backend genera `.dev.vars` automáticamente a partir de este archivo.

### 4. Crear la base de datos local

```bash
cd apps/backend
bunx wrangler d1 migrations apply questmasters --local --env preview
cd ../..
```

### 5. Levantar el proyecto

```bash
bun run dev
```

Levanta todo en paralelo via Turbo:

| App | URL |
|---|---|
| API (backend) | `http://127.0.0.1:3000` |
| Frontend | `http://localhost:3001` |
| Landing | `http://localhost:3002` |

> Si el puerto 3000 está ocupado, el backend elige el siguiente disponible y avisa en consola.
> En ese caso agrega `VITE_API_URL=http://127.0.0.1:<nuevo-puerto>` al `.env`.

## DM Orchestrator (opcional)

El DM IA usa el modelo `google/gemma-4-26B-A4B-it` corriendo en Google Colab via ngrok.
Para desarrollo local no es necesario — `DM_USE_RUNPOD=false` en `.env` lo deja en modo stub.

Para conectar con el modelo real:
1. Abre el notebook `apps/dm-orchestrator/scripts/dm_orchestrator_colab.ipynb` en Colab
2. Ejecuta todas las celdas — te dará una URL de ngrok
3. Actualiza en tu `.env`:
```bash
DM_MODEL_ENDPOINT_MAS=<url_ngrok>
DM_MODEL_ENDPOINT_MONOLITHIC=<url_ngrok>
```
4. Reinicia el backend (`bun run dev`)

## Estructura del monorepo

```
questmasters-monorepo/
├── apps/
│   ├── backend/          # API — Hono + Cloudflare Workers + D1 + R2
│   ├── frontend/         # SPA — React + Vite + TailwindCSS
│   ├── dm-orchestrator/  # Orquestador IA — Python + Gemma 26B
│   └── landing/          # Marketing — Astro
├── packages/
│   └── dnd-rules/        # Motor de reglas D&D (sin I/O)
├── context/              # Documentación del proyecto
│   ├── agent-context.md  # Visión estratégica
│   ├── backlog.md        # Roadmap de sprints
│   └── schema.sql        # Referencia completa de la BD
├── .env.example          # Plantilla de variables de entorno
└── turbo.json            # Config de Turborepo
```

## Migraciones de base de datos

Las migraciones están en `apps/backend/drizzle/`, organizadas por módulo:

| Archivo | Módulo |
|---|---|
| `0000_users.sql` | Perfiles y credenciales |
| `0001_content_packs.sql` | Packs y assets del marketplace |
| `0002_campaigns.sql` | Campañas, miembros y packs instalados |
| `0003_characters.sql` | Personajes de jugadores |
| `0004_dm_sessions.sql` | Sesiones de DM IA y turnos |

Para aplicar migraciones después de un pull:
```bash
cd apps/backend
bunx wrangler d1 migrations apply questmasters --local --env preview
```

Para recrear la BD desde cero (borra todos los datos locales):
```powershell
# PowerShell
Remove-Item -Recurse -Force apps\backend\.wrangler
cd apps/backend
bunx wrangler d1 migrations apply questmasters --local --env preview
```
