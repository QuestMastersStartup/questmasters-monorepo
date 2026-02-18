# QuestMasters

Plataforma Virtual Tabletop (VTT) de nueva generacion para juegos de rol, con asistente de IA integrado y marketplace de contenido homebrew.

## Arquitectura del Monorepo

```
questmasters-monorepo/
├── apps/
│   ├── api/          # Backend — NestJS + PostgreSQL (puerto 3000)
│   ├── client/       # Frontend — React + Vite + TailwindCSS (puerto 3001)
│   └── landing/      # Landing page publica
├── packages/
│   ├── dnd-rules/    # Tipos y logica de reglas D&D compartida
│   ├── ui/           # Componentes UI compartidos
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.yml
└── turbo.json
```

## Tech Stack

| Capa | Tecnologia |
|------|------------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Frontend** | React 18, Vite, TailwindCSS, React Router |
| **Backend** | NestJS, TypeORM, PostgreSQL 17 |
| **Shared** | `@questmasters/dnd-rules` — tipos TypeScript canonicos + logica de reglas |
| **Infra** | Docker Compose (postgres + api) |

## Inicio Rapido

### Requisitos

- Node.js >= 18
- pnpm >= 8
- Docker (para PostgreSQL)

### Setup

```bash
# Instalar dependencias
pnpm install

# Levantar base de datos
docker compose up -d postgres

# Desarrollo (api + client en paralelo)
pnpm turbo dev --filter=api --filter=client
```

- API: http://localhost:3000
- Client: http://localhost:3001

## Apps

### `apps/api` — Backend

API REST construida con NestJS siguiendo arquitectura hexagonal (DDD).

**Modulos principales:**

- **Rules Engine** (`src/rules-engine/`) — Motor de reglas D&D con seeding de datos SRD 5e
  - `domain/` — Entidades y logica de negocio
  - `application/` — Casos de uso
  - `infrastructure/` — Repositorios, seeding de datos SRD (JSON)

**Endpoints principales:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/packs` | Listar packs |
| POST | `/packs` | Crear pack con assets |
| GET | `/packs/:id` | Detalle de un pack |
| PUT | `/packs/:id` | Editar pack |
| DELETE | `/packs/:id` | Eliminar pack |

### `apps/client` — Frontend

SPA React con sistema de rutas, dark theme, y formularios especializados para creacion de contenido D&D.

**Paginas:**

| Ruta | Archivo | Descripcion |
|------|---------|-------------|
| `/library` | `Library.tsx` | Biblioteca personal de packs |
| `/marketplace` | `Marketplace.tsx` | Marketplace de contenido homebrew |
| `/packs/new` | `CreatePack.tsx` | Crear nuevo pack |
| `/packs/:id` | `PackDetails.tsx` | Ver detalle de pack |
| `/packs/:id/edit` | `EditPack.tsx` | Editar pack existente |

**Sistema de formularios de assets:**

El sistema de creacion de packs incluye formularios especializados para los 8 tipos core de D&D, con campos estructurados segun el SRD:

| Tipo | Layout | Formulario |
|------|--------|------------|
| **Class** | Slide-over panel | Hit die, saving throws, proficiencies, equipment, subclasses |
| **Race** | Slide-over panel | Speed, size, ability bonuses, languages, traits, subraces |
| **Spell** | Slide-over panel | Level, casting time, components V/S/M, damage, school, classes |
| **Equipment** | Slide-over panel | Category, cost, damage, range, weapon properties |
| **Monster** | Slide-over panel | 6 ability scores, AC, HP, speed, CR/XP, actions, legendary actions |
| **Feat** | Modal expandido | Description, prerequisites (ability score + minimum) |
| **Magic Item** | Modal expandido | Description, rarity, equipment category |
| **Background** | Modal expandido | Proficiencies, languages, feature, starting equipment |
| *Otros 19 tipos* | Modal basico | Nombre + descripcion |

**Componentes de formulario reutilizables** (`form-fields/`):

- `FormField` — Wrapper con label, hint, error
- `NumberField`, `SelectField`, `TextAreaField` — Inputs tipados
- `CollapsibleSection` — Secciones expandibles con chevron
- `TagInput` — Multi-value con pills
- `DescriptionArrayField` — Lista ordenada de parrafos
- `ReferencePicker` — Buscar/seleccionar assets del pack + creacion inline
- `AbilityBonusList` — Repeater ability score + bonus
- `DiceField` — Input con validacion de notacion de dados (2d6+3)
- `CostField` — Cantidad + unidad monetaria (gp/sp/cp)
- `ActionEditor` — Repeater para acciones de monstruo (nombre, desc, ataque, danio)

**Infraestructura del formulario:**

- `AssetFormPanel` — Slide-over drawer (derecho, full height) para tipos complejos
- `AddAssetModal` — Modal de seleccion de tipo con despacho por layout
- `asset-forms/index.ts` — Registry con `getAssetForm()` + `getFormLayout()`
- Persistencia de borradores con `useDraftPersistence` (localStorage)

## Packages

### `packages/dnd-rules`

Paquete compartido con tipos TypeScript canonicos para assets D&D 5e. Define las interfaces que tanto el backend como el frontend consumen:

- `BaseAsset`, `ClassAsset`, `RaceAsset`, `SpellAsset`, `EquipmentAsset`
- `MagicItemAsset`, `MonsterAsset`, `FeatAsset`, `BackgroundAsset`, `LevelAsset`
- `AssetType` enum con los 27 tipos soportados
- Tipos de soporte: `Choice`, `ReferenceItem`, `Option`, `OptionSet`

## Docker

```bash
# Levantar todo (postgres + api)
docker compose up -d

# Solo base de datos
docker compose up -d postgres

# Ver logs
docker compose logs -f api
```

**Servicios:**

| Servicio | Imagen | Puerto |
|----------|--------|--------|
| `postgres` | postgres:17-alpine | 5433:5432 |
| `api` | Build local | 3000:3000 |

## Estructura de un Pack

Un **Pack** es la unidad principal de contenido en QuestMasters. Contiene metadata y una coleccion de **Assets** tipados:

```json
{
  "name": "Adventurer's Toolkit",
  "description": "A collection of homebrew content",
  "version": "1.0.0",
  "type": "homebrew",
  "assets": [
    {
      "type": "spell",
      "name": "Arcane Bolt",
      "data": {
        "name": "Arcane Bolt",
        "index": "arcane-bolt",
        "level": 0,
        "school": { "index": "evocation", "name": "Evocation", "url": "..." },
        "components": ["V", "S"],
        "range": "120 feet",
        "duration": "Instantaneous",
        "casting_time": "1 action",
        "concentration": false,
        "ritual": false,
        "classes": [],
        "desc": ["You hurl a bolt of arcane energy..."]
      }
    }
  ]
}
```

Los assets siguen la estructura del SRD 5e para compatibilidad con el futuro agente IA y el marketplace.
