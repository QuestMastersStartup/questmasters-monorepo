## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

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
- Al modificar el schema de BD (agregar tabla, columna o índice), actualizar también `docs/schema.sql` para mantenerlo sincronizado

### Archivos que NO se deben crear ni committear

- `*.log`, `out.txt`, `error.log` — artefactos de runtime, nunca en git
- Scripts de debug ad-hoc (`check_schema.js`, `test-db.js`) en raíz de apps — si son necesarios, van en `scripts/`
- Directorios `tmp/` dentro de apps — usar `/tmp` del sistema o añadir al `.gitignore`
- `package-lock.json` o `pnpm-lock.yaml` dentro de workspaces — solo usar `bun install`
- Archivos de herramientas externas (TestSprite, Warp, etc.) — no pertenecen al repo
- Documentos de análisis o reportes como `.md` en la raíz — usar `context/` o no crearlos
- Skills de Claude Code (`.agents/`, `.claude/skills/`) — van en `~/.claude/`, no en el repo
- `WARP.md`, `skills-lock.json`, configuración personal de IDE — no son artefactos del proyecto
- `graphify-out/`, `.codegraph/` — output generado, ya en `.gitignore`

### Disciplina al escribir código

- No crear archivos de documentación (`.md`) salvo que el usuario los pida explícitamente
- No crear archivos de configuración de herramientas que no estén ya en uso en el proyecto
- No crear archivos de prueba en Python u otros lenguajes — el proyecto usa vitest con `.test.ts`
- No generar mocks, seeds ni datos de prueba fuera del directorio `src/` del módulo correspondiente
- No crear carpetas nuevas en la raíz del monorepo sin confirmar con el usuario
- No duplicar lógica que ya existe en `packages/dnd-rules` — consultarla antes de reimplementar

### Contexto del dominio

Los módulos implementados son: `content` (packs + assets), `campaigns`, `characters`, `users`, `dm-session`. Antes de añadir un módulo nuevo, verificar si ya existe con `graphify query "<concepto>"`. Las entidades god node son: `UUID`, `Result`, `ContentPack`, `Asset`, `UserProfile`, `Character`, `Campaign`, `Slug`.

El módulo `dm-session` conecta con `apps/dm-orchestrator/` vía `RunpodDmModelAdapter` — activado con `DM_USE_RUNPOD=true` en `.dev.vars`. El modelo base es `google/gemma-4-26B-A4B-it` (sin LoRA, base puro). Para dev local se usa Google Colab con ngrok.
