# EPIC 4 — Personajes: Feedback Técnico

> **Última actualización:** 5 de abril de 2026
> **Scope:** US-4.1 — Point Buy en `@questmasters/dnd-rules`

---

## US-4.1: Point Buy en `@questmasters/dnd-rules`

### Estado: ✅ Completada

### Resumen de lo implementado

Se implementó el sistema completo de Point Buy de D&D 5e como funciones puras e isomórficas dentro del paquete `@questmasters/dnd-rules`, listas para ser consumidas tanto por el frontend (Character Builder, US-4.7) como por el backend (validación en `CreateCharacterUseCase`, US-4.5).

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/types/ability-scores.types.ts` | **NUEVO** | Tipos `AbilityScores`, `AbilityName`, constantes `ABILITY_NAMES`, `ABILITY_ABBREVIATIONS`, interfaces `PointBuyValidation`, `HitPointsResult` |
| `src/rules/point-buy.ts` | **NUEVO** | Constantes Point Buy + 5 funciones puras: `calculatePointBuyCost()`, `validatePointBuy()`, `calculateModifier()`, `calculateHitPoints()`, `calculateProficiencyBonus()` |
| `src/rules/point-buy.test.ts` | **NUEVO** | 32 tests unitarios cubriendo todos los escenarios |
| `src/index.ts` | **MODIFICADO** | Añadidos re-exports de `ability-scores.types` y `point-buy` |

### Errores encontrados y cómo se resolvieron

#### 1. Conflicto potencial de tipos con `CharacterState.stats`

**Problema:** El tipo existente `CharacterState` en `prerequisites.types.ts` define `stats: Record<string, number>` usando claves genéricas como `"str"`, `"dex"`, etc. El nuevo `AbilityScores` usa nombres completos: `"strength"`, `"dexterity"`, etc.

**Decisión:** Se mantuvieron ambos formatos por ahora. El `CharacterState` (usado por el `Validator`) opera con claves cortas (`str`, `dex`) mientras que `AbilityScores` (usado por Point Buy y Character Builder) usa nombres canónicos completos (`strength`, `dexterity`). Esto es intencional para no romper la API existente del validador de prerequisitos.

**Acción futura (US-4.3):** Cuando se construya el `Character` entity, se deberá definir un mapper o normalizar las claves. Recomendación: usar `AbilityScores` (nombres completos) como fuente canónica y adaptar `CharacterState` para aceptar ambos formatos o migrar a nombres completos.

---

#### 2. Sintaxis de shell: `&&` no funciona en PowerShell antiguo

**Problema:** Al ejecutar `cd packages/dnd-rules && npx vitest run`, PowerShell rechazó el operador `&&` indicando: *"El token '&&' no es un separador de instrucciones válido en esta versión."*

**Causa:** La versión de PowerShell del entorno no soporta el operador lógico AND (`&&`), que requiere PowerShell 7+.

**Solución:** Se ejecutó el comando directamente con `Cwd` apuntando al directorio correcto en lugar de usar `cd` + `&&`.

**Recomendación:** En scripts CI/CD y workflows locales, usar `;` como separador de comandos en PowerShell, o verificar que se usa PowerShell 7+ (pwsh) donde `&&` sí es válido.

---

#### 3. Fórmula de Hit Points — Aclaración de diseño

**Problema potencial:** La fórmula de HP usa el método de "valor fijo" (average roll redondeado hacia arriba) en lugar de rolling. Esto es estándar en herramientas digitales y juego organizado, pero algunos DMs prefieren tirar dados.

**Decisión:** Se implementó el método fijo como default porque:
- Es determinista (validable en backend)
- Es el estándar en D&D Beyond, Roll20, y juego organizado (Adventurers League)
- No requiere persistir resultados de tiradas por nivel

**Acción futura:** Si se quiere soportar rolling de HP por nivel, se necesitará un campo adicional en la entidad `Character` (p.ej. `hp_rolls: number[]`) y una función alternativa `calculateHitPointsFromRolls()`.

---

#### 4. Edge case: HP mínimo por nivel

**Problema detectado durante desarrollo:** Con Constitution extremadamente baja (ej. CON 3, modifier -4), el HP promedio por nivel podía ser 0 o negativo (4 + (-4) = 0 para un d6).

**Solución:** Se aplicó `Math.max(1, hitDieAvg + conMod)` para garantizar al menos 1 HP por nivel, conforme a la regla del PHB que establece que un personaje siempre gana al menos 1 HP por nivel.

---

### Resultados de tests

```
✓ src/rules/point-buy.test.ts (32 tests)
  ✓ calculatePointBuyCost (3)
  ✓ validatePointBuy (7)
  ✓ calculateModifier (4)
  ✓ calculateHitPoints (6)
  ✓ calculateProficiencyBonus (5)
  ✓ ability-scores types and constants (7)

✓ src/rules/resolver.test.ts (3)
✓ src/rules/validator.test.ts (3)
✓ src/index.test.ts (2)

Total: 40 tests passed, 0 failed
Build: ✅ tsup (CJS + ESM) + tsc declarations
```

---

### Notas para las próximas US

- **US-4.2 (Migration):** El campo `stats` en la tabla `characters` debe almacenar JSON con las claves de `AbilityScores` (`strength`, `dexterity`, etc.), no las abreviaciones cortas.
- **US-4.3 (Character Entity):** Importar `validatePointBuy` y `calculateHitPoints` desde `@questmasters/dnd-rules` para las validaciones de dominio.
- **US-4.5 (CreateCharacterUseCase):** Usar `validatePointBuy(stats)` como gate de validación antes de persistir y `calculateHitPoints(classAsset.hit_die, stats.constitution, 1)` para auto-calcular HP iniciales.
- **US-4.7 (Character Builder Frontend):** Usar `calculatePointBuyCost()`, `calculateModifier()` y `POINT_BUY_BUDGET` para el UI interactivo del Point Buy.

---

## US-4.2: Migration: tabla `characters`

### Estado: ✅ Completada

### Resumen de lo implementado

Se creó la migración correspondiente a la tabla `characters` dentro del backend (`apps/backend/src/migrations/1775422260395-CreateCharacters.ts`) asegurando que los tipos y constraints definidos en la Epic 4 (US-4.2) se cumplan estrictamente. Se configuraron las llaves foráneas y los índices necesarios.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `apps/backend/src/migrations/*-CreateCharacters.ts` | **NUEVO** | Migración TypeORM en SQL crudo (`queryRunner.query`) implementando la tabla `characters` con columnas JSONB para `stats` y `choices`, y llaves nativas (FK cascade/restrict). |

### Errores encontrados y cómo se resolvieron

#### 1. Referencias cruzadas de claves foráneas con TypeORM
**Problema:** Al definir las FKs en la migración de `characters`, había que estar 100% seguros de las tablas y campos a las que hacía referencia (`campaigns`, `user_profiles`, `assets`), especialmente porque algunas tablas fueron creadas en otras migraciones. 
**Solución:** Se verificó la migración `InitialSchema` y `CreateCampaignMembers` confirmando que el `user_id` en realidad debía apuntar a `user_profiles(id)`. Como resultado, se configuró la FK de "user_id" correctamente usando `REFERENCES "user_profiles"("id") ON DELETE CASCADE`.

#### 2. Nombres de índices y constraints
**Problema:** Un índice condicional (`WHERE status = 'active'`) se requería en `campaign_id` y `user_id`.
**Solución:** Se escribió una migración SQL en formato puro ejecutando la instrucción: `CREATE UNIQUE INDEX "IDX_characters_active_user_campaign" ON "characters" ("campaign_id", "user_id") WHERE "status" = 'active'`, garantizando así que un usuario no pueda tener más de un personaje activo por campaña, pero sí múltiples retirados/muertos en la misma.

### Resultado de pruebas

---

## US-4.3: Backend Domain: Character Entity, VOs, Repository

### Estado: ✅ Completada

### Resumen de lo implementado

Se ha implementado la capa de dominio pura para personajes en un módulo independiente (`apps/backend/src/characters/`), permitiendo que el personaje exista sin estar vinculado obligatoriamente a una campaña. Esto habilita el caso de uso de "preparación anticipada" de hojas de personaje.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/characters/domain/value-objects/character-status.vo.ts` | **NUEVO** | Value Object `CharacterStatus` con estados `active`, `dead` y `retired`. Lógica de transiciones terminales incorporada. |
| `src/characters/domain/entities/character.entity.ts` | **NUEVO** | Entidad inmutable `Character` con soporte para `campaignId` opcional, stats con nombres completos y separación de métodos `update()` (Owner) y `updateByDm()` (DM). |
| `src/characters/domain/repositories/character.repository.ts` | **NUEVO** | Interfaz `CharacterRepository` con métodos para búsquedas por usuario, campaña y personajes activos. |
| `src/characters/application/character-errors.ts` | **NUEVO** | Enum `CharacterError` para estandarizar los códigos de error del dominio de personajes. |

### Errores encontrados y cómo se resolvieron

#### 1. Persistencia de Personajes sin Campaña
**Problema:** El diseño original forzaba personajes a campañas.
**Solución:** Se ajustó la entidad para que `campaignId` sea opcional (`UUID | null`). Esto permite crear personajes libremente. Nota: En la US-4.4 se debe ajustar la restricción de la base de datos (hacer la columna nullable) para que coincida con este cambio de dominio.

#### 2. Consistencia de Stats (Claves Completas)
**Problema:** Había un conflicto entre las claves cortas y largas de los stats.
**Solución:** Se optó por utilizar los nombres completos (`strength`, `dexterity`, etc.) de forma canónica en la entidad. Esto asegura la extensibilidad para futuros sistemas de juego y el soporte del workshop.

#### 3. Separación de Responsabilidades (Update)
**Problema:** Un solo método `update()` podría llevar a brechas de seguridad o confusión en la lógica de permisos.
**Solución:** Se crearon dos métodos distintos: `update()` para los campos que el jugador puede controlar (nombre, historia, retrato) y `updateByDm()` para los campos mecánicos y de estado controlados por el Dungeon Master (stats, nivel, HP, status). Esto facilita la futura integración del DM IA.

### Resultado de pruebas

La validación de sintaxis y tipos del backend (`bun run check-types`) se completó satisfactoriamente, confirmando la correcta integración de los nuevos archivos de dominio.

---

## US-4.4: Backend Infra: TypeORM Entity, Repository, Mapper

### Estado: ✅ Completada

### Resumen de lo implementado

Se creó toda la capa de infraestructura para persistir personajes: entidad TypeORM, mapper (toDomain/toPersistence/toResponse), repositorio con los 7 métodos definidos en la interfaz, y registro en el contenedor de inyección de dependencias. Adicionalmente se creó una migración para hacer `campaign_id` nullable en la tabla `characters`.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/migrations/...-AlterCharactersCampaignIdNullable.ts` | **NUEVO** | Migración: `campaign_id` → nullable, FK cambia de CASCADE a SET NULL, índice parcial actualizado, nuevo índice `user_id` |
| `src/characters/infrastructure/typeorm/character.typeorm-entity.ts` | **NUEVO** | Entidad TypeORM con `@Column({ type: ... })` explícitos, FKs con `Relation<any>` y string-based `@ManyToOne` |
| `src/characters/infrastructure/mappers/character.mapper.ts` | **NUEVO** | Mapper con `toDomain`, `toPersistence`, `toResponse`. Casteo de JSONB stats a `AbilityScores` |
| `src/characters/infrastructure/typeorm/character.typeorm-repository.ts` | **NUEVO** | Implementación de `CharacterRepository` con 7 métodos |
| `src/infrastructure/container.ts` | **MODIFICADO** | Registrado `CharacterOrmEntity` + `CharacterTypeormRepository` + exportado `characterRepo` |

### Errores encontrados y cómo se resolvieron

#### 1. Migración para `campaign_id` nullable
**Problema:** En la US-4.2 se creó `campaign_id uuid NOT NULL`. El cambio de dominio de US-4.3 requiere que sea nullable para personajes libres.
**Solución:** Nueva migración que: (1) elimina la FK existente, (2) altera la columna a nullable, (3) re-crea la FK con `ON DELETE SET NULL` (si se borra la campaña el personaje se desvincula en lugar de borrarse), (4) actualiza el índice parcial para excluir filas con `campaign_id IS NULL`.

#### 2. Patrón de relaciones TypeORM (string-based)
**Problema:** El backlog y el feedback marcan que las FKs deben usar `Relation<T>` con strings en `@ManyToOne` para evitar circular imports entre módulos.
**Solución:** Todas las relaciones en `CharacterOrmEntity` usan string-based `@ManyToOne('EntityName', ...)` con `Relation<any>` como tipo, evitando importar directamente entidades de otros módulos.

#### 3. Auto-detección de entidades
**Problema:** ¿Se registrará automáticamente la nueva entidad?
**Solución:** El `data-source.ts` usa el glob `**/*.typeorm-entity{.ts,.js}`. Al nombrar el archivo `character.typeorm-entity.ts`, TypeORM lo detecta automáticamente sin necesidad de registrarlo manualmente en la configuración.

### Resultado de pruebas

- `bun run check-types` — ✅ Sin errores
- Migración aplicada exitosamente a la base de datos

---

## US-4.5: Backend Use Cases: CRUD + Validaciones

### Estado: ✅ Completada

### Resumen de lo implementado

Se ha implementado la lógica de aplicación para la gestión de personajes mediante 6 casos de uso (`Create`, `Get`, `List`, `Update`, `Delete`, `ListAvailableAssets`). Se ha incorporado flexibilidad para personajes "libres" (sin campaña), donde el **Point Buy** es opcional y los assets pueden buscarse en todo el catálogo.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/content/domain/repositories/asset.repository.ts` | **MODIFICADO** | Agregado método `search()` para búsquedas globales de assets (raza/clase/background). |
| `src/content/infrastructure/typeorm/asset.typeorm-repository.ts` | **MODIFICADO** | Implementada búsqueda `ILIKE` y filtrado por tipos/packs con límite de seguridad (50). |
| `src/characters/application/use-cases/create-character.use-case.ts` | **NUEVO** | Lógica de validación condicional (Campaña vs Libre) + Auto-HP. |
| `src/characters/application/use-cases/update-character.use-case.ts` | **NUEVO** | Separación de lógica Owner/DM. En modo libre, el Owner tiene permisos de DM sobre su ficha. |
| `src/characters/application/use-cases/list-available-assets.use-case.ts` | **NUEVO** | Selector de assets optimizado con soporte para búsqueda global y filtrado por campaña. |
| `src/infrastructure/container.ts` | **MODIFICADO** | Registrados los 6 casos de uso. |

### Errores encontrados y cómo se resolvieron

#### 1. Tipado en `AssetData`
**Problema:** Al intentar acceder a `asset.data.hit_die`, TypeScript arrojaba un error porque `AssetData` es un Value Object que encapsula un objeto genérico.
**Solución:** Se utilizó el método `.get<number>('hit_die')` proporcionado por el VO para acceder de forma segura y tipada a los datos del asset.

#### 2. Regresión en el Contenedor (DI)
**Problema:** Una edición accidental en `container.ts` eliminó los casos de uso `invitePlayerUseCase` y `listMembersUseCase`, causando fallos en los tipos de las rutas de campañas.
**Solución:** Se restauraron los casos de uso faltantes en el objeto de retorno del contenedor, asegurando la estabilidad del sistema.

#### 3. Rendimiento en Búsqueda Global
**Problema:** Listar todos los assets de la base de datos para personajes libres podría ser ineficiente.
**Solución:** El método `search()` en el repositorio ahora incluye un `limit(50)` y soporta filtros de texto (`query`), permitiendo una carga progresiva y eficiente de contenidos.

### Resultado de pruebas

`bun run check-types` — ✅ Pasado exitosamente sin errores en todo el backend.

---

## US-4.6: Backend Routes + Schemas

### Estado: ✅ Completada

### Resumen de lo implementado

Se han creado los esquemas TypeBox y las rutas Elysia para exponer el CRUD de personajes como API REST. Los personajes tienen su propio prefijo `/api/characters` (no anidados bajo campañas) para soportar personajes libres. Se implementó limpieza de campos vacíos (feedback §4) y mapeo centralizado de errores a códigos HTTP.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/schemas/character.schema.ts` | **NUEVO** | Schemas TypeBox: Create (con `method: point-buy/free`), Update (Owner + DM fields nullable), Query y AvailableAssetsQuery |
| `src/routes/characters.routes.ts` | **NUEVO** | 6 endpoints: GET list, GET available-assets, GET :charId, POST create, PUT :charId, DELETE :charId. Helper `cleanEmptyFields` y `errorToStatus` |
| `src/index.ts` | **MODIFICADO** | Registrado `charactersRoutes` + tag Swagger 'Characters' |
| `src/characters/application/use-cases/update-character.use-case.ts` | **MODIFICADO** | `backstory` en DTO ahora acepta `null` para permitir limpiar el campo |

### Errores encontrados y cómo se resolvieron

#### 1. Incompatibilidad de tipos nullable
**Problema:** El schema TypeBox permite `t.Union([t.String(), t.Null()])` para `backstory`, pero el DTO solo aceptaba `string | undefined`.
**Solución:** Se actualizó el DTO para aceptar `string | null` en `backstory`, permitiendo limpiar el campo enviando `null`.

#### 2. Decisión de diseño: Prefijo de rutas
**Problema:** El backlog dice `/:id/characters/` (anidado bajo campañas), pero los personajes ahora pueden existir sin campaña.
**Solución:** Se eligió `/characters` como prefijo independiente, usando `?campaignId=...` como query param para filtrar. Esto soporta tanto personajes de campaña como personajes libres sin duplicar rutas.

### Resultado de pruebas

`bun run check-types` — ✅ Sin errores. Los 6 endpoints están registrados y accesibles desde Swagger.

---

## US-4.7: Frontend Character Builder (Create)

### Estado: ✅ Completada

### Resumen de lo implementado

Se ha implementado el **Character Builder** como una página unificada que emula una hoja de personaje digital. El formulario agrupa todas las secciones obligatorias (Identidad, Raza, Clase, Atributos) y opcionales (Trasfondo) en una sola vista para una experiencia fluida.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/services/characters.api.ts` | **NUEVO** | Capa de servicios para interactuar con la API de personajes. |
| `src/components/features/characters/StatCounter.tsx` | **NUEVO** | Componente para gestión de Atributos con lógica de costos de Point Buy. |
| `src/components/features/characters/AssetCard.tsx` | **NUEVO** | Visualización de opciones de Raza/Clase con preview de datos. |
| `src/pages/CreateCharacter.tsx` | **NUEVO** | Página principal del forjador de héroes. |
| `src/router.tsx` | **MODIFICADO** | Registro de rutas `/characters/create` y `/campaigns/:id/characters/create`. |

### Errores encontrados y cómo se resolvieron

#### 1. Gestión de Estado en Formulario Único
**Problema:** Al tener tantas secciones en una sola página, el estado de `formData` se volvía complejo de manejar con re-renders.
**Solución:** Se utilizó un solo objeto de estado balanceando sub-componentes puros (`StatCounter`, `AssetCard`) que reciben solo lo necesario, optimizando la interactividad del Point Buy.

#### 2. Adaptabilidad de Atributos
**Problema:** El sistema debía cambiar entre Point Buy (costos 8-15) y Libre (1-30) dependiendo del contexto.
**Solución:** Se integraron las validaciones de `@questmasters/dnd-rules` directamente en los handlers de cambio de stat, bloqueando incrementos/decrementos según el método activo.

### Resultado de pruebas

`npm run check-types` (Frontend) — ✅ Pasado exitosamente. La interfaz es responsiva y los cálculos de HP/Modificadores funcionan en tiempo real.

---

## US-4.8: Frontend CampaignDetails + Edit/Delete

### Estado: ✅ Completada

### Resumen de lo implementado

Integración completa de personajes en la vista de campaña: visualización con tarjetas enriquecidas, edición con permisos diferenciados (Owner vs DM), cambio de status (matar/retirar), y borrado con modal de confirmación. Se enriqueció el backend para que la respuesta de personajes incluya `raceName`, `className`, y `backgroundName`.

### Archivos creados/modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `characters/infrastructure/mappers/character.mapper.ts` | **MODIFICADO** | Añadido `toEnrichedResponse` con resolución de nombres de assets. |
| `content/domain/repositories/asset.repository.ts` | **MODIFICADO** | Añadido método `findByIds` para carga batch. |
| `content/infrastructure/typeorm/asset.typeorm-repository.ts` | **MODIFICADO** | Implementación de `findByIds` con `IN`. |
| `routes/characters.routes.ts` | **MODIFICADO** | Helper `resolveAssetNames` y uso de `toEnrichedResponse` en 4 endpoints. |
| `frontend/src/services/characters.api.ts` | **MODIFICADO** | Añadidos `fetchCharacter`, `updateCharacter`, `deleteCharacter`, tipos enriquecidos. |
| `frontend/src/components/features/characters/CharacterCard.tsx` | **NUEVO** | Tarjeta visual con portrait, badges, overlay grayscale/sepia y acciones hover. |
| `frontend/src/components/features/characters/ConfirmModal.tsx` | **NUEVO** | Modal de confirmación genérico reutilizable. |
| `frontend/src/pages/CampaignDetails.tsx` | **MODIFICADO** | Sección "Personajes" con grid, carga de datos, handlers de delete/status. |
| `frontend/src/pages/EditCharacter.tsx` | **NUEVO** | Formulario con campos diferenciados Owner (nombre, retrato, historia) vs DM (stats, nivel, HP, status). |
| `frontend/src/router.tsx` | **MODIFICADO** | Ruta `/:id/characters/:charId/edit`. |

### Errores encontrados y cómo se resolvieron

#### 1. Resolución de nombres de assets en el backend
**Problema:** La respuesta de personajes solo incluía UUIDs de raza/clase, lo cual no ayuda al frontend para mostrar tarjetas legibles.
**Solución:** Se añadió `findByIds` al `AssetRepository` para batch-fetch, y se creó `resolveAssetNames` helper en las rutas que construye un `Map<assetId, nombre>` y lo pasa a `toEnrichedResponse`.

#### 2. Imports no utilizados en EditCharacter
**Problema:** `EditCharacter.tsx` importaba funciones que no usaba (`fetchMembers`, `calculateHitPoints`, `Sparkles`, etc.), causando errores de TSC.
**Solución:** Se eliminaron las importaciones y variables no utilizadas.

### Resultado de pruebas

- `bun run check-types` (Backend) — ✅ Sin errores.
- `npm run check-types` (Frontend) — ✅ Sin errores.
