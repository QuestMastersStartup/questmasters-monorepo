## Grafo de código

Este proyecto usa dos MCP de grafo de código (reemplazan a graphify, retirado). Ambos son gratuitos — sin costo de tokens LLM, sin toolchain que mantener — y no indexan markdown/docs, solo código.

- **codebase-memory-mcp**: arquitectura general, clusters y hotspots. Usar `get_architecture` para visión global (packages, rutas, hotspots, capas, clusters — equivalente a los "god nodes" que daba graphify), `search_graph`/`query_graph` para preguntas de código, `trace_path` para relación entre dos símbolos. Reindexar tras cambios grandes con `index_repository` (~0.5s, sin costo). Cada dev reindexa localmente al clonar — no se comitea el artefacto compartido `.codebase-memory/graph.db.zst` (es opcional y reindexar es casi gratis, no vale la pena el merge overhead del binario).
- **codegraph** (`.codegraph/`): ya corre en segundo plano vía file watcher, se auto-sincroniza solo — nunca hace falta re-indexar manualmente. Usar `codegraph_explore`/`codegraph_impact`/`codegraph_callers`/`codegraph_callees` para "si cambio esto, qué se rompe" (blast radius) y búsqueda rápida de símbolos.

Para preguntas sobre archivos `.md`/`.txt` (no indexados por ninguno de los dos), leer el archivo directamente.

## Convención de shell

El equipo trabaja en Windows con PowerShell, no bash. Cualquier comando que se le dé al usuario para ejecutar manualmente debe estar en PowerShell (no bash/sh). Claude puede seguir usando bash internamente para sus propias tool calls.

## Política de commits y builds

- Nunca commitear si no se pide explícitamente — ni siquiera para arreglos pequeños o "obvios". Excepción: cuando el propio plan de trabajo aprobado por el usuario indica un commit por paso (ej. ejecución de un plan con subagent-driven-development) — ahí el commit ya fue pedido al aprobar el plan.
- Nunca agregar `Co-Authored-By` ni firmas similares en los mensajes de commit.
- Antes de dar por terminado cualquier cambio de código, correr el build del app afectado (`bun run build`, o al menos `bun run check-types`) para detectar errores de tipos/compilación antes de reportar éxito.

## Proyecto QuestMasters

QuestMasters es un VTT (Virtual Tabletop) web-based. El DM humano es el protagonista; la IA actúa como copiloto, nunca como reemplazo.

### Arquitectura del stack

- **Backend:** Hono + DDD + Cloudflare Workers. `apps/backend/src/`
- **Frontend:** React + Vite + TailwindCSS. `apps/frontend/src/`
- **DM Orchestrator:** Python + Google Colab / RunPod. `apps/dm-orchestrator/` — modelo Gemma 4 26B-A4B-it (base, sin LoRA)
- **Reglas D&D:** `packages/dnd-rules/src/` — lógica pura sin I/O
- **Landing:** `apps/landing/` — Astro separado (marketing)

### Dónde va cada tipo de archivo

| Qué crear | Dónde |
|-----------|-------|
| Nueva página frontend | `apps/frontend/src/pages/` |
| Componente de feature | `apps/frontend/src/components/features/{módulo}/` |
| Componente UI reutilizable | `apps/frontend/src/components/ui/` |
| Nuevo use case backend | `apps/backend/src/{módulo}/application/use-cases/` |
| Nueva entidad de dominio | `apps/backend/src/{módulo}/domain/entities/` |
| Value object | `apps/backend/src/{módulo}/domain/value-objects/` |
| Ruta HTTP | `apps/backend/src/routes/` |
| Schema de validación (Zod) | `apps/backend/src/schemas/` |
| Migración de DB | `apps/backend/src/migrations/` |
| Lógica de reglas D&D | `packages/dnd-rules/src/` |
| Documentación del proyecto | `context/` |
| Script de utilidad | `apps/backend/scripts/` (nunca en la raíz del app) |
| Handler/agente Python (DM) | `apps/dm-orchestrator/src/` |
| Script de inicialización RunPod | `apps/dm-orchestrator/scripts/` |

### Convenciones de código

- **Backend usa Hono, NO NestJS** — no usar `@Injectable()`, `@Controller()`, `@Module()` ni decorators de NestJS
- Use cases retornan `Result<T, Error>` — ver `apps/backend/src/shared/application/result.ts`
- Entidades extienden `BaseEntity` — ver `apps/backend/src/shared/domain/entities/base.entity.ts`
- IDs usan el value object `UUID` — ver `apps/backend/src/shared/domain/value-objects/uuid.vo.ts`
- Slugs usan el value object `Slug` — ver `apps/backend/src/shared/domain/value-objects/slug.vo.ts`
- No usar `console.log` en producción — usar `apps/backend/src/shared/infrastructure/logger.ts`
- Tests van junto al archivo que testean: `{nombre}.test.ts` en la misma carpeta
- Al modificar el schema de BD (agregar tabla, columna o índice), actualizar también `context/schema.sql` para mantenerlo sincronizado

### Archivos que NO se deben crear ni committear

- `*.log`, `out.txt`, `error.log` — artefactos de runtime, nunca en git
- Scripts de debug ad-hoc (`check_schema.js`, `test-db.js`) en raíz de apps — si son necesarios, van en `scripts/`
- Directorios `tmp/` dentro de apps — usar `/tmp` del sistema o añadir al `.gitignore`
- `package-lock.json` o `pnpm-lock.yaml` dentro de workspaces — solo usar `bun install`
- Archivos de herramientas externas (TestSprite, Warp, etc.) — no pertenecen al repo
- Documentos de análisis o reportes como `.md` en la raíz — usar `context/` o no crearlos
- Skills de Claude Code (`.agents/`, `.claude/skills/`) — van en `~/.claude/`, no en el repo
- `WARP.md`, `skills-lock.json`, configuración personal de IDE — no son artefactos del proyecto
- `.codegraph/` — output generado, ya en `.gitignore`

### Disciplina al escribir código

- No crear archivos de documentación (`.md`) salvo que el usuario los pida explícitamente
- No crear archivos de configuración de herramientas que no estén ya en uso en el proyecto
- No crear archivos de prueba en Python u otros lenguajes — el proyecto usa vitest con `.test.ts`
- No generar mocks, seeds ni datos de prueba fuera del directorio `src/` del módulo correspondiente
- No crear carpetas nuevas en la raíz del monorepo sin confirmar con el usuario
- No duplicar lógica que ya existe en `packages/dnd-rules` — consultarla antes de reimplementar

### Regla de modelo único para orquestación DM

**Todo lo que ocurre dentro de una sesión de DM (MAS o monolítica) DEBE usar exclusivamente el modelo Gemma 4 (`google/gemma-4-26B-A4B-it`).** Esto incluye: router de intenciones, agentes (arbiter, npc, world, narrator), extracción post-turno (L2/L3), y memoria de trabajo (L1/LightRAG). No usar APIs externas (Groq, Workers AI, OpenAI, etc.) para ninguna parte de la orquestación del DM.

**Excepción:** el auto-player (simulación de jugador para testing) SÍ puede usar Workers AI (`@cf/meta/llama-3.2-3b-instruct`) porque no es parte de la orquestación del DM — es una herramienta de desarrollo.

### Contexto del dominio

Los módulos implementados son: `content` (packs + assets), `campaigns`, `characters`, `users`, `dm-session`. Antes de añadir un módulo nuevo, verificar si ya existe con `search_graph` (codebase-memory-mcp) o `codegraph_search`. Las entidades hotspot (mayor fan-in) son: `UUID`, `Result`, `ContentPack`, `Asset`, `UserProfile`, `Character`, `Campaign`, `Slug`.

El módulo `dm-session` conecta con `apps/dm-orchestrator/` vía `StubDmModelAdapter` (dev) o `RunpodDmModelAdapter` (prod) — seleccionado con `DM_USE_RUNPOD` en `.dev.vars`. El modelo base es `google/gemma-4-26B-A4B-it` (sin LoRA, base puro). Para dev local se usa Google Colab con ngrok.
