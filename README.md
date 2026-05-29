# QuestMasters

Plataforma Virtual Tabletop (VTT) de nueva generación para juegos de rol, con asistente de IA integrado y marketplace de contenido homebrew.

## Estado del Proyecto

### ✅ Completado (v0.5)

**EPIC 0: Fundaciones Técnicas**
- ✅ Arquitectura de monorepo con Turborepo + pnpm workspaces
- ✅ Backend Elysia con arquitectura hexagonal (DDD)
- ✅ Frontend React + Vite + TailwindCSS
- ✅ Paquete compartido `@questmasters/dnd-rules` con tipos TypeScript
- ✅ Docker Compose con PostgreSQL 17
- ✅ Sistema de formularios escalable (3 niveles: panel/modal-rich/modal-basic)
- ✅ **CRUD de Packs completo** con 8 formularios especializados de assets
- ✅ Seeding de datos SRD 5e (2014 + 2024) - 39 archivos JSON
- ✅ Landing page con 11 secciones

**Sistema de Content Packs:**
- Creación, edición, listado y eliminación de packs
- 8 tipos de assets con formularios especializados (Class, Race, Spell, Equipment, Monster, Feat, Magic Item, Background)
- 19 tipos adicionales con formularios básicos
- Persistencia de borradores con localStorage
- Validación de reglas D&D 5e con `@questmasters/dnd-rules`

### 🚧 Próximos Pasos

El roadmap está organizado en épicas que desbloquean funcionalidades progresivamente:

**EPIC 1: Autenticación y Usuarios** (Sprint 3-4)
- [ ] Integración con Supabase Auth (email/password + OAuth: Google, Discord)
- [ ] Sistema de perfiles de usuario (username, avatar, bio)
- [ ] Sistema de roles (admin, creator, player)
- [ ] Guards y middleware de autenticación en API
- [ ] Context de autenticación en React con rutas protegidas

**EPIC 2: Marketplace y Workshop** (Sprint 5-6)
- [ ] Estados de publicación de packs (draft/published/under_review)
- [ ] Búsqueda y filtrado de packs en marketplace
- [ ] Sistema de instalación de packs en biblioteca personal
- [ ] Workshop/Dashboard de creador con estadísticas
- [ ] Sistema de valoraciones y reseñas (rating 1-5 + comentarios)

**EPIC 3: Gestión de Campañas y Sesiones** (Sprint 7-9)
- [ ] CRUD de campañas (nombre, descripción, sistema, portada, packs)
- [ ] Sistema de invitaciones (link/código con expiración)
- [ ] Creador de personajes vinculado a campañas
- [ ] Programación de sesiones con notificaciones
- [ ] Dashboard de campaña (miembros, personajes, sesiones, notas)

**EPIC 4: Mesa Virtual - Tiempo Real** (Sprint 10-13) ⚡ *CORE MVP*
- [ ] Infraestructura WebSockets (Elysia WS + Socket.IO)
- [ ] Chat en tiempo real con canales (general, whisper, in-character)
- [ ] Sistema de dados virtuales con notación estándar (2d6+3, ventaja/desventaja)
- [ ] Mapa 2D interactivo con tokens arrastrables y grid
- [ ] Fog of War básico (revelar/ocultar áreas)
- [ ] Hoja de personaje en tiempo real durante sesiones

**EPIC 5: Buscador de Partidas** (Sprint 14-15)
- [ ] Publicación de campañas en buscador (horario, sistema, nivel, idioma, estilo)
- [ ] Búsqueda con filtros y ordenamiento
- [ ] Sistema de solicitudes para unirse a partidas

**EPIC 6: DM Asistido por IA** (Sprint 16-19) 🤖 *DIFERENCIADOR*
- [ ] Generador de NPCs con contexto de campaña
- [ ] Diario de campaña automático con resúmenes IA
- [ ] Modo "Click & Play" con DM IA para one-shots
- [ ] Tutorial interactivo guiado por IA para nuevos jugadores

**EPIC 7: Mobile y PWA** (Sprint 20-21) 📱
- [ ] PWA instalable con service worker
- [ ] UI responsiva para todas las páginas críticas
- [ ] Controles táctiles optimizados (thumb zone, gestos, bottom sheet)

### 🎯 Hito Crítico: MVP Jugable

El **MVP jugable** requiere completar **EPIC 1** (Auth) + **EPIC 4** (Mesa Virtual). Esto permite:
- Usuarios con identidad propia
- Creación de campañas
- Jugar partidas en tiempo real con mapa, dados y chat

Todo lo demás (marketplace, IA, mobile) son iteraciones sobre esta base.

## Arquitectura del Monorepo

```
questmasters-monorepo/
├── apps/
│   ├── backend/      # Backend — Elysia + PostgreSQL (puerto 3000)
│   ├── frontend/     # Frontend — React + Vite + TailwindCSS (puerto 3001)
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
| **Backend** | Elysia, TypeORM, PostgreSQL 17 |
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

### `apps/backend` — Backend

API REST construida con Elysia siguiendo arquitectura hexagonal (DDD).

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

## Filosofía de Diseño

### Lecciones de Project Sigil (VTT cancelado de Wizards)

QuestMasters aprende de los errores que llevaron al cierre de Project Sigil:

| Error de Sigil | Enfoque de QuestMasters |
|----------------|-------------------------|
| **Barrera de Hardware** — Unreal Engine 5 requería PCs de gama alta | **Accesibilidad Radical** — Web-based, PWA ligera, funcional en tablets y móviles de gama media |
| **"Videojueguización"** — Animaciones 3D que limitaban la imaginación | **Herramienta Invisible** — Mapas 2D reactivos, UI limpia, Teatro de la Mente opcional |
| **Jardín Vallado** — Pobre integración con D&D Beyond, sin homebrew | **El Cerebro Conector** — Importador universal, soporte de PDFs, marketplace abierto tipo Steam Workshop |
| **IA que Reemplaza** — DM autónomo que generó desconfianza | **Arquitectura Copiloto** — IA como asistente, no jefe. Capa lógica determinista + capa narrativa IA |

### Diferenciadores Estratégicos

**1. Ecosistema Abierto**
- **Sincronización Multiplataforma**: Compra una vez (ej. D&D Beyond), juega en QuestMasters sin coste adicional
- **Conexión Bidireccional**: Cambios en hojas de personaje externas se reflejan en tiempo real
- **Marketplace Simplificado**: Steam Workshop para D&D — creadores publican contenido (gratis o pago) sin barreras

**2. Inmersión de Nueva Generación**
- **Híbrido 2D/3D**: Importa mapas 2D tradicionales, úsalos en espacio 3D con iluminación dinámica
- **Modular "Lego Digital"**: DMs pueden modificar entornos sobre la marcha
- **Efectos Ambientales**: Lluvia, cambio día/noche, efectos de hechizos

**3. Accesibilidad y Comunidad**
- **Buscador de Partidas**: Encuentra grupos por sistema, horario, estilo (casual/serio, combat/RP)
- **Modelo Freemium Generoso**: Nivel gratuito robusto sin limitaciones frustrantes
- **Compatibilidad Universal**: Navegador web (sin instalación) + app móvil funcional

**4. Asistente IA "Write, Speak & Play"**
- **Interacción Híbrida**: Voz + texto con TTS natural diferenciado por NPC
- **Mundo Persistente**: "Archivo infinito" que recuerda decisiones, NPCs, eventos
- **Generación Dinámica**: Monstruos, items, puzzles creados en respuesta a acciones
- **Juego Instantáneo**: Click-&-Play sin preparación ("Inicia aventura de 90 min en ciudad portuaria")
- **Tutorial IA**: Modo guiado para nuevos jugadores que evita barreras de entrada y acoso

### Principios de Desarrollo

1. **Accesibilidad sobre Gráficos** — Funcional en cualquier dispositivo > efectos visuales impresionantes
2. **Asistencia sobre Reemplazo** — La IA ayuda al DM, no lo sustituye
3. **Comunidad sobre Control** — Marketplace abierto > jardín vallado
4. **Juego sobre Configuración** — Reducir tiempo de preparación al mínimo

## Contribuir

Este es un proyecto en desarrollo activo. Para contribuir:

1. Revisa el [agent-context.md](context/agent-context.md) para entender el estado actual
2. Consulta el [questmasters-req.md](context/questmasters-req.md) para la visión del producto
3. Sigue las convenciones de código establecidas en `packages/eslint-config`
4. Todos los PRs deben pasar los checks de CI/CD (cuando se implementen en EPIC 0)

## Licencia

Pendiente de definir.
