# Resumen de Dificultades Técnicas (Sesión US-0.3 a US-3.3)

Este documento resume los retos técnicos encontrados durante el fortalecimiento de la infraestructura y el desarrollo de nuevos módulos como Campañas.

## 1. Infraestructura de Pruebas y Docker (US-0.3 a US-0.5)

- **Contexto de Build e Incompatibilidad de Symlinks:** En Windows, el comando `docker build` fallaba por symlinks en `node_modules`. Se solucionó actualizando `.dockerignore`.
- **Inconsistencia de Lockfile:** `bun install --frozen-lockfile` fallaba en Alpine. Se eliminó el flag para permitir conciliación nativa.
- **Rutas en Código Empaquetado:** `import.meta.dir` no funcionaba post-build. Se cambió a `process.cwd()`.

## 2. Autenticación y Elysia (US-1.1 a US-1.4)

- **Elysia Plugin Scoping:** El `derive()` en plugins no se propagaba. Se optó por funciones utilitarias directas (`requireUser`) en los handlers para mayor claridad y seguridad.
- **Auth Interception & Guest UX:** Se implementó `AuthActionGuard` con `onClickCapture` para interceptar acciones protegidas de usuarios invitados sin ensuciar componentes individuales.
- **Enforcement de Ownership:** Patrón "Fetch-Authorize-Execute" para validar que el usuario sea dueño del recurso antes de mutarlo.

## 3. TypeORM + Bun: Desafíos de Ejecución

- **Inferencia de Tipos (@Column):** Bun no soporta `emitDecoratorMetadata` de forma nativa igual que Node/TS-Node. Esto impide que TypeORM infiera el tipo de la columna (ej: `string` -> `varchar`).
  - **Error Típico:** `DataTypeNotSupportedError: Data type "Object" is not supported`.
  - **Solución:** Especificar siempre el `type` explícitamente: `@Column({ type: 'varchar' })`.
- **Dependencias Circulares (@ManyToOne):** Bun es más sensible que Node a las inicializaciones de módulos. En relaciones `@OneToMany` / `@ManyToOne`, se lanzaba `ReferenceError: Cannot access 'EntityName' before initialization`.
  - **Contexto:** Ocurría al intentar referenciar `CampaignOrmEntity` desde `CampaignInstalledPackOrmEntity` durante la carga del repositorio.
  - **Solución Definitiva:**
    1. Usar el envoltorio `Relation<T>` en la definición de la propiedad (ej. `campaign: Relation<CampaignOrmEntity>`).
    2. **Refinado:** Para grafos circulares complejos, usar el nombre de la clase como string `@ManyToOne('CampaignOrmEntity', ...)` y `import type` para el tipado.
    3. Asegurar que la función de retorno en el decorador sea lazy: `@ManyToOne(() => CampaignOrmEntity, ...)`.

## 4. Desarrollo del Módulo de Campañas (US-3.1)

- **Configuración de la Base de Datos:** Se implementó una tabla junction manual `campaign_installed_packs` en lugar de una automática de TypeORM para permitir auditoría (`installed_at`) y control total sobre las cascadas (`ON DELETE CASCADE`).
- **Enforcement de Tokens en el Frontend (Error 401):** 
  - **Problema:** Rutas protegidas devolvían `401 Unauthorized` incluso con sesión activa. El backend (`requireUser`) busca el token en el header `Authorization: Bearer <token>`.
  - **Causa:** El middleware de Supabase en el frontend maneja cookies, pero nuestra API de Elysia requiere el token JWT explícito enviado desde el cliente.
  - **Solución:** Implementar un helper `getHeaders()` que use `supabase.auth.getSession()` para obtener el `access_token` actual e inyectarlo en cada petición `fetch`.
- **Validación de Esquemas (Elysia/TypeBox):**
  - **Problema:** El backend fallaba con `400 Bad Request` al enviar campos opcionales vacíos (ej: `coverImageUrl: ""`) cuando el esquema esperaba una URI válida o `undefined`.
  - **Solución:** Limpiar el `formData` en el frontend antes del envío, eliminando keys con valores vacíos para que coincidan con `t.Optional()`.

## 5. Sistema de Imágenes y Performance

- **Optimización en el Cliente (Resizing):** Para ahorrar ancho de banda y almacenamiento en el bucket `campaign-portrait`, se implementó reescalado por software (Canvas API) antes de la subida.
  - **Flujo:** `File` -> `Canvas (max 800px)` -> `Blob (image/webp)` -> `Supabase Storage`.
- **Seguridad en Storage (RLS):**
  - **Lección:** Las políticas de Supabase Storage son granulares. Se configuró una estructura `/id_usuario/portrait-timestamp.webp` para permitir que el RLS verifique que `(storage.foldername(name))[1] = auth.uid()` en operaciones de modificación y borrado.
- **Headers en FormData:** Al usar `fetch` con `FormData` para subir archivos, **NUNCA** se debe establecer manualmente el `Content-Type: multipart/form-data`. El navegador debe generarlo junto con la `boundary` única. Si se sobrescribe, el backend no podrá parsear el archivo.

## 6. Sistema de Invitación de Jugadores (US 3.2)

- **Búsqueda por Similitud de Texto (Escalabilidad):** Para el MVP se optó por `ILIKE` sobre `pg_trgm` por simplicidad y compatibilidad inmediata, asegurando que el campo `username` esté indexado.
- **UX en Búsqueda Adaptativa:** Se implementó un `debounce` de 400ms en el frontend para evitar peticiones excesivas a la API durante el tipeo, protegiendo tanto el servidor como los límites del pool de conexiones de Supabase.
- **Seguridad en Membresías:** El uso de una clave primaria compuesta (`campaign_id`, `user_id`) garantiza integridad a nivel de base de datos, previniendo duplicados accidentales incluso ante condiciones de carrera en el frontend.

## 7. Planificación de Personajes en Campaña (US 3.3)

### 7.1 Decisiones Arquitectónicas

- **Point Buy es preferible a Standard Array:** Ofrece más libertad creativa al usuario. El sistema de costos de D&D 5e es: stats base de 8, 27 puntos para distribuir, costos incrementales por nivel (8→13 = 1pt cada uno, 14 = 2pts, 15 = 2pts). Implementar como funciones puras en `@questmasters/dnd-rules`.
- **1 personaje activo por campaña mediante índice parcial:** PostgreSQL soporta `CREATE UNIQUE INDEX ... WHERE status = 'active'`, lo cual es más flexible que un constraint simple `(campaign_id, user_id)` porque permite múltiples personajes `dead`/`retired` para el mismo usuario en la misma campaña (historial). **Recordar:** TypeORM no soporta `WHERE` en `@Index`, la migration debe escribirse con SQL raw para este índice.
- **Personaje muerto ≠ eliminado:** El personaje muerto/retirado permanece en la BD como registro histórico. Se muestra en el frontend con overlay visual (grayscale). El jugador puede crear uno nuevo (el unique parcial lo permite).

### 7.2 Diseño de Datos para IA

- **JSONB de `stats`** debe tener schema consistente: `{ str, dex, con, int, wis, cha }` — siempre 6 keys con valores numéricos. Esto facilita que un agente IA lea y modifique stats programáticamente.
- **JSONB de `choices`** almacena las selecciones resueltas del character builder (proficiencies elegidas, traits de raza, etc.) en formato `Record<string, string[]>` donde la key es el identificador del choice y el value son los IDs seleccionados. Esto preserva el historial de decisiones para que la IA pueda entender cómo se construyó el personaje.
- **Los asset IDs (`race_asset_id`, `class_asset_id`, `background_asset_id`)** como FKs directas permiten JOINs eficientes para que el agente IA acceda al data completo del asset (traits, features, etc.) sin parsear JSONB.

### 7.3 Gestión de Complejidad

- **Features complejas deben descomponerse ANTES de codificar:** US 3.3 se descompuso en 8 sub-stories secuenciales. Cada sub-story es independientemente verificable y deployable. Esto evita PRs gigantes y permite detectar errores temprano.
- **Orden de ejecución para minimizar riesgo:** Shared package (dnd-rules) → Migration → Domain → Infrastructure → Use Cases → Routes → Frontend Create → Frontend Edit. Cada capa se puede testear antes de construir la siguiente.
- **Cross-module dependencies:** `CreateCharacterUseCase` necesita 4 repositorios (character, campaign, campaignMember, asset). Esto es señal de que es un aggregate boundary complejo. Asegurarse de que el DI container inyecte todos los repos necesarios.

### 7.4 Patrones de Seguridad para CRUD de Personajes

- **Validación de membresía doble:** No basta con `requireUser`; el handler debe verificar que el usuario es miembro de la campaña específica antes de permitir operaciones sobre personajes.
- **Campos con permisos diferenciados en Update:** El esquema TypeBox acepta todos los campos, pero el use case debe validar: campos como `stats`, `level`, `hitPoints`, `status` solo los puede modificar el DM. El dueño del personaje solo puede editar `name`, `backstory`, `portraitUrl`, `choices`.
- **Asset validation contra packs de campaña:** Al crear un personaje, se debe verificar que `raceAssetId` y `classAssetId` pertenezcan a assets cuyos packs están instalados en la campaña. Esto requiere un JOIN: `assets.pack_id IN (SELECT pack_id FROM campaign_installed_packs WHERE campaign_id = ?)`.
