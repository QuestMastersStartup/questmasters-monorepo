# Deploy Cloudflare Workers — Pasos pendientes

Migración backend Elysia → Hono + Cloudflare Workers + D1 completada.
Código compila sin errores. Falta ejecutar los pasos de infraestructura.

---

## 1. Crear la base de datos D1

```bash
cd apps/backend
wrangler d1 create questmasters
```

Reemplazar `PLACEHOLDER_REPLACE_WITH_REAL_ID` en `apps/backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "questmasters"
database_id = "<id-obtenido-arriba>"
```

## 2. Aplicar migraciones

El SQL está en `apps/backend/drizzle/0000_groovy_fat_cobra.sql`.

```bash
# Local (para desarrollo con wrangler dev)
wrangler d1 migrations apply questmasters --local

# Producción
wrangler d1 migrations apply questmasters
```

## 3. Configurar secrets

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put DM_MODEL_ENDPOINT_MAS
wrangler secret put DM_MODEL_ENDPOINT_MONOLITHIC
```

Para el entorno preview añadir `--env preview` a cada comando.

## 4. Script de seed SRD (Fase 7)

Crear `apps/backend/scripts/seed-srd-d1.ts` que:
1. Lee los JSON de `src/content/infrastructure/seeding/data/`
2. Genera `drizzle/seeds/srd.sql` con `INSERT OR IGNORE INTO` en batches ≤ 500
3. Se ejecuta con:

```bash
bun run apps/backend/scripts/seed-srd-d1.ts
wrangler d1 execute questmasters --file=./drizzle/seeds/srd.sql --local
wrangler d1 execute questmasters --file=./drizzle/seeds/srd.sql  # producción
```

## 5. Actualizar URL en el frontend

Cambiar la base URL de la API en el frontend:

| Entorno | URL |
|---------|-----|
| Dev | `http://localhost:8787` |
| Preview | `https://questmasters-api-preview.<subdominio>.workers.dev` |
| Producción | `https://questmasters-api.<subdominio>.workers.dev` (o dominio custom) |

Buscar en `apps/frontend/` donde se define la URL base de la API y actualizarla.

## 6. Probar localmente

```bash
cd apps/backend
wrangler dev
# Worker disponible en http://localhost:8787
# GET http://localhost:8787/health  →  { status: "ok" }
```

## 7. Deploy

```bash
# Preview
wrangler deploy --env preview

# Producción
wrangler deploy
```

---

## Acceso compartido con el colega

1. Ir al Cloudflare Dashboard → Account → **Manage Account → Members**
2. Invitar su email con rol **Administrator**
3. El colega hace `wrangler login` y ya puede deployar

El `database_id` y `account_id` van en `wrangler.toml` (commiteado en git).
Los secrets se configuran independientemente por entorno desde el dashboard o CLI.
