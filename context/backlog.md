# QuestMasters — Backlog de Producto

> **Última actualización:** 13 de abril de 2026
> **Convenciones:** ✅ Completada · 🔶 Parcial · 🔄 En progreso · ⬜ Pendiente · ❌ Bloqueada
> **Formato de US:** Como [rol], quiero [acción visible], para [beneficio]
> **Roles:** 👤 Jugador · 🎲 DM (Director de Juego) · 🛡️ Admin · 👁️ Visitante (no autenticado)
> **Docs relacionados:** [questmasters-req.md](./questmasters-req.md) · [agent-context.md](./agent-context.md) · [feedback.md](./feedback.md)

---

## Resumen de Progreso

| Sprint | Nombre | Estado | Progreso |
|--------|--------|--------|----------|
| Sprint 1 | Bases | ✅ 100% | Infra completa, Auth funcional + OAuth Google/Discord ✅, token refresh robusto ✅, Sidebar completo con "My Characters" ✅ |
| Sprint 2 | Juego | 🔶 ~75% | Campañas 100%, Personajes CRUD ✅, página "Mis Personajes" cross-campaña ✅, inventario pendiente |
| Sprint 3 | Tablero | ⬜ 0% | No iniciado |
| Sprint 4 | Comunidad e IA | ⬜ ~5% | Solo publicación parcial de packs |

---

## Sprint 1: Bases

> **Objetivo:** Infraestructura profesional, autenticación segura y perfiles de usuario completos. Los cimientos sobre los que se construye todo lo demás.

---

### EPIC 0: Infraestructura de Desarrollo

> **Objetivo:** Monorepo estable, CI/CD funcional, base de datos con migraciones, Docker listo, API documentada.

#### US-0.1 — CI/CD automático ✅

> Como **desarrollador**, quiero que cada push ejecute lint, types, tests y build automáticamente, para detectar errores antes de mergear.

**Implementación:**
- [x] GitHub Actions con 4 jobs paralelos: API, Client, Landing, dnd-rules
- [x] `oven-sh/setup-bun@v2` como runtime
- [x] Pipeline: `bun install → lint → check-types → test → build`

---

#### US-0.2 — Base de datos con migraciones ✅

> Como **desarrollador**, quiero migraciones versionadas y controladas, para que los cambios de esquema sean seguros y reproducibles.

**Implementación:**
- [x] TypeORM con `synchronize: false`
- [x] 6 migraciones versionadas: InitialSchema, AddPackStatus, CreateCampaigns, CreateCampaignMembers, CreateCharacters, AlterCharactersCampaignIdNullable
- [x] Scripts: `migration:generate`, `migration:run`, `migration:revert`

---

#### US-0.3 — Documentación de API (Swagger) ✅

> Como **desarrollador**, quiero documentación interactiva de todos los endpoints, para entender y probar la API fácilmente.

**Implementación:**
- [x] Swagger/OpenAPI en `/api/docs` en desarrollo
- [x] Tags para Packs, Assets, Rules, Campaigns, Characters, Users

---

#### US-0.4 — Contenedorización Docker ✅

> Como **desarrollador**, quiero levantar todo el entorno con un solo comando, para que cualquier miembro del equipo pueda desarrollar sin fricción.

**Implementación:**
- [x] `apps/backend/Dockerfile` multi-stage con Bun Alpine (build → runtime)
- [x] `docker-compose.yml` con PostgreSQL 17 + pgAdmin
- [x] Puerto local: 5433 (PostgreSQL), 3000 (API)

---

#### US-0.5 — Cobertura de tests base 🔶

> Como **desarrollador**, quiero al menos 60% de cobertura en tests unitarios, para garantizar estabilidad en refactors y nuevas features.

**Tareas pendientes:**
- [x] Tests para `dnd-rules` (resolver, validator, point-buy): ~17 tests
- [x] Tests para content use cases: ~6 tests
- [x] Tests para `CreateCampaignUseCase`, `UpdateCampaignUseCase`, `DeleteCampaignUseCase`
- [x] Tests para `InvitePlayerUseCase`, `RemoveMemberUseCase`
- [x] Tests para character use cases: Create, Update, Delete
- [x] Tests para value objects: `CampaignStatus`, `CharacterStatus` (SystemType ya existía)
- [ ] Target: 60% coverage global — 138 tests pasando, verificar % exacto con `bun test --coverage`

---

#### US-0.6 — Observabilidad y logging ✅

> Como **administrador**, quiero ver logs estructurados y recibir alertas de errores, para monitorear la salud de la plataforma.

**Tareas:**
- [x] Sentry en frontend (`@sentry/react` v10) — solo activo en `PROD`, 10% tracing, replay en errores. Backend: no tiene SDK Bun estable, errores capturados por logger
- [x] Logging estructurado con logger Bun-compatible (`src/shared/infrastructure/logger.ts`) — JSON en prod, legible en dev
- [x] Log de cada request con método, ruta, status, duración (middleware `onRequest` + `onAfterResponse`)
- [x] Health check endpoint: `GET /health` — retorna status, timestamp, uptime
- [x] Uptime monitor en OpenStatus (ID: 9381) — ping a `/health` cada 10m desde `iad` y `gru`

---

#### US-0.7 — Validación de configuración ✅

> Como **desarrollador**, quiero que la aplicación falle rápido si faltan variables de entorno obligatorias, para evitar errores silenciosos en producción.

**Tareas:**
- [x] Validar `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` al levantar
- [x] Fallar con mensaje claro si falta variable requerida (`src/infrastructure/env.ts`)
- [x] Usar `Bun.env` con tipo seguro — exporta objeto `env` tipado

---

### EPIC 1: Autenticación y Seguridad

> **Objetivo:** Login/registro seguro, sesión persistente, múltiples providers, protección de rutas.

#### US-1.1 — Registrarme con email y contraseña ✅

> Como **visitante**, quiero crear una cuenta con mi email y contraseña, para acceder a las funcionalidades de la plataforma.

**Implementación:**
- [x] `Register.tsx` con formulario: email, password, username
- [x] Validación de username único en tiempo real (`GET /username/check/:username`)
- [x] Supabase Auth signup → creación automática de `UserProfile`
- [x] Redirect a `/marketplace` tras registro exitoso

---

#### US-1.2 — Iniciar sesión ✅

> Como **usuario registrado**, quiero hacer login con mis credenciales, para acceder a mi cuenta y mis campañas.

**Implementación:**
- [x] `Login.tsx` con email/password
- [x] Supabase Auth signIn con JWT
- [x] Redirect a la ruta protegida original o `/marketplace`

---

#### US-1.3 — Cerrar sesión ✅

> Como **usuario autenticado**, quiero cerrar sesión desde cualquier pantalla, para proteger mi cuenta en dispositivos compartidos.

**Implementación:**
- [x] Botón de logout en Sidebar
- [x] `supabase.auth.signOut()` + limpieza de estado

---

#### US-1.4 — Protección de rutas privadas ✅

> Como **usuario**, quiero que las páginas privadas redirijan al login si no estoy autenticado, para que mi información esté segura.

**Implementación:**
- [x] `ProtectedRoute` component con redirect a `/login`
- [x] `AuthContext.tsx` con `useAuth()` hook
- [x] Escucha `onAuthStateChange` para estado de sesión
- [x] Backend: `requireUser`, `requireRole`, `requireOwnerOrAdmin` guards

---

#### US-1.5 — Iniciar sesión con Google ✅

> Como **visitante**, quiero registrarme/logearme con mi cuenta de Google, para no tener que recordar otra contraseña.

**Implementación:**
- [x] Google OAuth configurado en Supabase Dashboard
- [x] Botón "Continuar con Google" en Login.tsx y Register.tsx
- [x] Callback redirect a `/library` con `redirectTo: window.location.origin + "/library"`
- [x] `UserProfile` creado automáticamente via trigger de Supabase o GET /users/me al primer login
- [x] En Register: se guarda `pending_username` en sessionStorage antes del redirect, se sincroniza al volver
- [x] Probado exitosamente en producción tras configurar Supabase

---

#### US-1.6 — Iniciar sesión con Discord ✅

> Como **visitante**, quiero registrarme/logearme con mi cuenta de Discord, para usar la misma identidad que uso en mis comunidades de rol.

**Implementación:**
- [x] Discord OAuth configurado en Supabase Dashboard
- [x] Botón "Continuar con Discord" en Login.tsx y Register.tsx
- [x] Callback redirect a `/library` manejado correctamente
- [x] `UserProfile` creado automáticamente igual que en Google OAuth
- [x] Probado exitosamente en producción tras configurar Supabase

---

#### US-1.7 — Renovación automática de sesión ✅

> Como **usuario**, quiero que mi sesión se renueve automáticamente sin tener que logearme de nuevo, para no perder mi trabajo por expiración de token.

**Implementación:**
- [x] `onAuthStateChange` en AuthContext ya escucha `TOKEN_REFRESHED` y actualiza el estado
- [x] Creado `lib/api.ts` con `authFetch`: llama `supabase.auth.getSession()` antes de cada request, garantizando token siempre fresco
- [x] `AuthContext` expone `authFetch` para que los componentes no usen tokens stale del estado
- [x] Supabase SDK auto-refresca tokens según configuración del Dashboard (por defecto 1h con auto-refresh)

---

#### US-1.8 — Feedback para usuarios invitados ✅

> Como **visitante**, quiero recibir una indicación clara al intentar una acción protegida, para entender que necesito registrarme.

**Implementación:**
- [x] `AuthActionGuard` con `onClickCapture` intercepta acciones protegidas
- [x] `GuestBanner.tsx` — banner informativo con CTA a login
- [x] No ensucia componentes individuales con lógica de auth

---

### EPIC 2: Perfil de Usuario

> **Objetivo:** Perfil editable, avatar upload, username único, identidad visible en sidebar.

#### US-2.1 — Ver y editar mi perfil ✅

> Como **usuario**, quiero editar mi nombre de usuario y biografía desde mi perfil, para personalizar mi identidad en la plataforma.

**Implementación:**
- [x] `Profile.tsx` — editar username, bio
- [x] Vista de estadísticas del usuario
- [x] Backend: `GetUserProfileUseCase`, `UpdateUserProfileUseCase`

---

#### US-2.2 — Subir avatar personalizado ✅

> Como **usuario**, quiero subir una imagen como avatar, para que otros me reconozcan visualmente.

**Implementación:**
- [x] Endpoint `POST /avatar/upload` → Supabase Storage `avatars` bucket
- [x] Reescalado client-side (Canvas API → WebP, max 800px)
- [x] RLS por `auth.uid()` en Supabase Storage

---

#### US-2.3 — Username único con validación ✅

> Como **usuario**, quiero elegir un nombre de usuario único y ver inmediatamente si está disponible, para no perder tiempo con duplicados.

**Implementación:**
- [x] Endpoint `GET /username/check/:username`
- [x] Feedback en tiempo real en Register y Profile (debounce)

---

#### US-2.4 — Buscar otros usuarios ✅

> Como **DM**, quiero buscar usuarios por nombre para invitarlos a mi campaña.

**Implementación:**
- [x] `SearchUsersUseCase` con `ILIKE`
- [x] `UserSearch.tsx` con debounce 400ms
- [x] Integrado en el modal de invitación de campañas

---

#### US-2.5 — Sidebar con identidad del usuario ✅

> Como **usuario**, quiero ver mi avatar y nombre en la barra lateral, para saber que estoy logueado y navegar fácilmente.

**Implementación:**
- [x] `Sidebar.tsx` con navegación principal
- [x] Muestra avatar y nombre del usuario
- [x] Refinamiento visual: active indicator con borde izquierdo + glow, hover states mejorados, botón logout aparece solo al hacer hover
- [x] Enlace "My Characters" (icono `Swords`) → `/characters` — implementado con US-4.6

---

#### US-2.6 — Banner informativo para invitados ✅

> Como **visitante**, quiero ver un banner que me explique qué es QuestMasters y me invite a registrarme, para entender el valor de la plataforma.

**Implementación:**
- [x] `GuestBanner.tsx` con CTA a registro/login

---

## Sprint 2: Juego

> **Objetivo:** El core loop del juego de rol — crear campañas, construir personajes, gestionar contenido, equipar items. El usuario debe poder preparar todo lo necesario para jugar.

---

### EPIC 3: Gestión de Campañas

> **Objetivo:** CRUD completo de campañas con portada, estado, miembros y packs instalados.
> **Prerrequisito:** EPIC 1 + EPIC 2 ✅
> **Roles involucrados:** 🎲 DM (crea y gestiona), 👤 Jugador (ve y participa)

#### US-3.1 — Crear una nueva campaña ✅

> Como **DM**, quiero crear una campaña indicando nombre, descripción, sistema de juego y portada, para organizar una mesa de rol con mis jugadores.

**Implementación:**
- [x] `CreateCampaign.tsx` — formulario con nombre, descripción, sistema, portrait upload
- [x] Backend: `CreateCampaignUseCase` → entity `Campaign`
- [x] VOs: `CampaignStatus` (active/paused/completed), `SystemType`
- [x] Upload portrait → Supabase Storage `campaign-portrait` bucket
- [x] Redirect a detalle de campaña tras creación

---

#### US-3.2 — Ver listado de mis campañas ✅

> Como **usuario**, quiero ver todas las campañas donde participo (como DM o jugador), para acceder rápidamente a mis partidas.

**Implementación:**
- [x] `Campaigns.tsx` — listado con cards
- [x] Backend: `ListCampaignsUseCase` (filtra por userId como DM o miembro)
- [x] Cards muestran: nombre, sistema, estado, portada, cantidad de miembros

---

#### US-3.3 — Ver detalle de una campaña ✅

> Como **miembro de una campaña**, quiero ver toda la información de la campaña incluyendo miembros, personajes y packs instalados, para tener el panorama completo de mi partida.

**Implementación:**
- [x] `CampaignDetails.tsx` — hero section con portada, stats, miembros, packs, acciones rápidas
- [x] Sección de personajes con `CharacterCard.tsx`
- [x] Vista diferenciada DM vs Jugador (acciones disponibles)

---

#### US-3.4 — Editar mi campaña ✅

> Como **DM**, quiero editar el nombre, descripción, sistema y portada de mi campaña, para mantener actualizada la información.

**Implementación:**
- [x] `EditCampaign.tsx` — formulario pre-poblado
- [x] Backend: `UpdateCampaignUseCase` con Fetch-Authorize-Execute
- [x] Solo el DM owner o admin pueden editar

---

#### US-3.5 — Eliminar mi campaña ✅

> Como **DM**, quiero eliminar una campaña que ya no uso, para mantener limpio mi listado.

**Implementación:**
- [x] Backend: `DeleteCampaignUseCase`
- [x] Confirmación en frontend antes de eliminar
- [x] Solo el DM owner o admin pueden eliminar

---

#### US-3.6 — Cambiar estado de campaña (Pausar/Reanudar/Finalizar) ✅

> Como **DM**, quiero pausar, reanudar o finalizar mi campaña, para reflejar el estado real de mi partida.

**Implementación:**
- [x] `PATCH /:id/status` con transiciones validadas
- [x] Transiciones permitidas: active↔paused, active/paused→completed (terminal)
- [x] Botones en CampaignDetails: Pausar, Reanudar, Finalizar

---

#### US-3.7 — Subir portada de campaña ✅

> Como **DM**, quiero subir una imagen de portada para mi campaña, para darle identidad visual.

**Implementación:**
- [x] `POST /campaigns/portrait` → Supabase Storage
- [x] Canvas resize → WebP client-side
- [x] RLS por `auth.uid()`

---

#### US-3.8 — Invitar jugadores a mi campaña ✅

> Como **DM**, quiero buscar usuarios y agregarlos a mi campaña, para armar mi grupo de juego.

**Implementación:**
- [x] Modal con `UserSearch` + `MemberCard`
- [x] `InvitePlayerUseCase` con validación de duplicados
- [x] `CampaignMember` entity con PK compuesta (campaign_id + user_id)

---

#### US-3.9 — Remover jugadores de mi campaña ✅

> Como **DM**, quiero remover un jugador de mi campaña, para gestionar la composición de mi grupo.

**Implementación:**
- [x] `RemoveMemberUseCase` — `DELETE /:id/members/:userId`
- [x] Solo DM o admin pueden eliminar
- [x] Botón en MemberCard con modal de confirmación

---

#### US-3.10 — Ver miembros de la campaña ✅

> Como **miembro de una campaña**, quiero ver quiénes participan con username y avatar, para conocer a mi grupo.

**Implementación:**
- [x] `ListMembersUseCase` — `GET /:id/members`
- [x] Join con `user_profiles` para username + avatar
- [x] Lista de miembros visible en CampaignDetails

---

#### US-3.11 — Instalar packs de contenido en mi campaña ✅

> Como **DM**, quiero instalar packs de contenido (razas, clases, items) en mi campaña, para definir qué recursos están disponibles para mis jugadores.

**Implementación:**
- [x] `POST /:id/packs` — junction table `campaign_installed_packs`
- [x] Entity con `installPacks()` method
- [x] UI: selector de packs en CampaignDetails

---

#### US-3.12 — Desinstalar packs de contenido ✅

> Como **DM**, quiero desinstalar packs que ya no necesito en mi campaña, para simplificar las opciones de mis jugadores.

**Implementación:**
- [x] `DELETE /:id/packs` — `uninstallPacks()`
- [x] UI: botón de remover en pack instalado

---

### EPIC 4: Gestión de Personajes

> **Objetivo:** CRUD completo de personajes con character builder (Point Buy), vista en campaña, módulo independiente "Mis Personajes", y ficha individual.
> **Prerrequisito:** EPIC 3 ✅
> **Roles involucrados:** 👤 Jugador (crea y gestiona su PJ), 🎲 DM (ve todos, edita stats/status, puede eliminar)
> **Decisiones de diseño:** Point Buy (27 puntos), 1 personaje activo por jugador por campaña, muerto/retirado = deshabilitado (historial preservado)

#### US-4.0 — Crear un personaje independiente (sin campaña) ✅

> Como **jugador**, quiero crear un personaje sin necesidad de estar en una campaña, para tenerlo listo y unirlo a una campaña cuando quiera.

**Implementación:**
- [x] Botón "Crear Personaje" en cabecera de página "Mis Personajes" → `/characters/create`
- [x] Estado vacío actualizado: CTA primario "Crear Personaje" + secundario "Ver Campañas"
- [x] `CreateCharacter.tsx` funciona sin `campaignId`: back link → `/characters`, redirect post-creación → `/characters`
- [x] Método de stats: Point Buy o Libre (1-30) — selector visible solo en modo standalone
- [x] Assets disponibles: todos los packs activos (sin filtro de campaña)
- [x] Backend: `CreateCharacterUseCase` soporta `campaignId: null` con validación diferenciada

**Decisión de diseño:** Los personajes son entidades independientes. Al crear uno en una campaña se validan los packs instalados y se aplica Point Buy obligatorio. Un personaje standalone puede importarse a una campaña creando un clon exclusivo (pendiente US-4.10).

---

#### US-4.1 — Crear un personaje para mi campaña ✅

> Como **jugador miembro de una campaña**, quiero crear un personaje eligiendo nombre, raza, clase, stats (Point Buy) y backstory, para participar en la aventura.

**Implementación:**
- [x] `CreateCharacter.tsx` — Wizard multi-paso: Identidad → Raza → Clase → Stats (Point Buy) → Background
- [x] Motor Point Buy en `@questmasters/dnd-rules`: `validatePointBuy()`, `calculatePointBuyCost()`, `calculateModifier()`, `calculateHitPoints()`
- [x] Assets filtrados por packs instalados en la campaña (`ListAvailableAssetsUseCase`)
- [x] Backend: `CreateCharacterUseCase` — valida campaña activa + usuario miembro + sin PJ activo + assets en packs + Point Buy válido + auto-calcula HP
- [x] Ruta: `/campaigns/:id/characters/create`

**Tareas técnicas completadas:**
- [x] Tipos `AbilityScores`, `ABILITY_NAMES`, constantes Point Buy en `dnd-rules`
- [x] Migration: tabla `characters` (id, campaign_id, user_id, name, race_asset_id, class_asset_id, level, stats jsonb, hit_points, portrait_url, backstory, status, choices, etc.)
- [x] Domain: `Character` entity inmutable, `CharacterStatus` VO (active→dead/retired terminal), `CharacterRepository` interface, `CharacterError` enum
- [x] Infra: `CharacterOrmEntity`, `CharacterTypeormRepository`, `CharacterMapper`, DI registration
- [x] Routes: `characters.routes.ts` con esquemas TypeBox, 6 endpoints bajo `/:id/characters/`
- [x] Tests: 11+ tests Point Buy en `dnd-rules`

---

#### US-4.2 — Ver personajes en el detalle de campaña ✅

> Como **miembro de una campaña**, quiero ver los personajes de todos los miembros dentro del detalle de la campaña, para conocer al grupo de aventureros.

**Implementación:**
- [x] Sección "Personajes" en `CampaignDetails.tsx`
- [x] `CharacterCard.tsx` — portrait, nombre, raza, clase, nivel, status
- [x] Muertos/retirados: overlay visual + badge de estado
- [x] Botón "Crear Personaje" solo si el jugador no tiene PJ activo

---

#### US-4.3 — Editar mi personaje ✅

> Como **jugador**, quiero editar el nombre, backstory y portrait de mi personaje, para refinar su historia y apariencia.

**Implementación:**
- [x] `EditCharacter.tsx` pre-poblado con datos actuales
- [x] Campos editables por jugador: name, backstory, portraitUrl, choices
- [x] Backend: `UpdateCharacterUseCase` con permisos diferenciados
- [x] Ruta: `/campaigns/:id/characters/:charId/edit`

---

#### US-4.4 — (DM) Gestionar personajes de los jugadores ✅

> Como **DM**, quiero editar stats, nivel y HP de los personajes, y poder marcarlos como muertos o retirados, para reflejar los eventos de la narrativa.

**Implementación:**
- [x] Campos editables por DM: stats, level, hitPoints, status
- [x] Acciones: Kill (active→dead), Retire (active→retired) — ambos terminales
- [x] Backend valida permisos DM vs Owner diferenciados

---

#### US-4.5 — Eliminar un personaje ✅

> Como **dueño de un personaje o DM**, quiero poder eliminar un personaje, para limpiar personajes de prueba o no deseados.

**Implementación:**
- [x] `DeleteCharacterUseCase` — solo dueño o DM
- [x] Modal de confirmación antes de eliminar
- [x] Backend: `DELETE /:id/characters/:charId`

---

#### US-4.6 — Ver listado "Mis Personajes" (todos, cross-campaña) ✅

> Como **jugador**, quiero ver un listado de todos mis personajes en una sola página, sin importar en qué campaña estén, para tener una vista global de mi historial de personajes.

**Implementación:**
- [x] Nueva página `Characters.tsx` — ruta `/characters` con `ProtectedRoute`
- [x] Backend: endpoint `GET /characters/me` — llama `listCharactersUseCase({ userId })` + resuelve asset names y campaign names en paralelo
- [x] Cards con: portrait, nombre, raza (badge ámbar), clase (badge índigo), nivel, HP, campaña (link clickeable), status overlay (muerto/retirado)
- [x] Secciones separadas: Activos (verde) / Historial (muertos + retirados, opacidad reducida)
- [x] Estado vacío: mensaje + CTA a Campañas
- [x] `fetchMyCharacters()` en `characters.api.ts` usando `MyCharacter` type con `campaignName`
- [x] Enlace "My Characters" (icono Swords) en Sidebar — completa US-2.5 ✅

---

#### US-4.7 — Ver ficha individual de un personaje ⬜ 🆕

> Como **jugador**, quiero ver la ficha completa de mi personaje en una página dedicada, para consultar todos los detalles (stats, habilidades, backstory, equipo) de un vistazo.

**Tareas:**
- [ ] Nueva página `CharacterSheet.tsx` — ruta `/characters/:charId`
- [ ] Secciones: identidad (nombre, raza, clase, nivel), stats con modificadores, HP, proficiency bonus, backstory, portrait grande
- [ ] Diseño estilo hoja de personaje D&D moderna
- [ ] Si es mi personaje: botón "Editar"
- [ ] Si soy DM de su campaña: botón "Editar como DM"
- [ ] Link a la campaña donde pertenece

---

#### US-4.8 — Filtrar y buscar personajes ⬜ 🆕

> Como **jugador**, quiero filtrar mis personajes por campaña, clase, raza o estado, para encontrar rápidamente al que busco.

**Tareas:**
- [ ] Filtros en página "Mis Personajes": por campaña, estado (active/dead/retired), clase, raza
- [ ] Barra de búsqueda por nombre
- [ ] Backend: extender `GET /characters/me` con query params de filtrado

---

#### US-4.10 — Importar un personaje existente a una campaña (clon) ⬜ 🆕

> Como **jugador**, quiero importar uno de mis personajes independientes a una campaña, para que se cree una copia exclusiva de esa campaña con su propio desarrollo.

**Tareas:**
- [ ] En `CampaignDetails.tsx` (sección personajes): botón "Importar personaje" visible si el jugador es miembro y no tiene PJ activo
- [ ] Modal: lista los personajes propios sin campaña activa → selecciona uno → confirmar
- [ ] Backend: nuevo endpoint `POST /campaigns/:id/characters/import` — recibe `sourceCharacterId`, clona la entidad con `campaignId` del destino, `campaignId` original queda intacto
- [ ] El personaje original NO se modifica; el clon es independiente desde el momento de importación
- [ ] Validaciones: campaña activa, usuario miembro, sin PJ activo en destino, assets del PJ disponibles en packs de la campaña (o advertencia si no están)

---

#### US-4.9 — Ver personajes muertos/retirados en historial ⬜ 🆕

> Como **jugador**, quiero ver mis personajes muertos o retirados con una marca visual clara, para recordar mis aventuras pasadas sin confundirlos con los activos.

**Tareas:**
- [ ] En la página "Mis Personajes": sección separada o toggle "Mostrar historial"
- [ ] Visual: grayscale + badge de estado (💀 Muerto / 🏰 Retirado)
- [ ] Click lleva a la ficha individual (solo lectura)

---

### EPIC 5: Packs y Contenido (Workshop Lite)

> **Objetivo:** Sistema completo de creación, publicación y consumo de packs de contenido (razas, clases, items, etc.). Base del futuro Marketplace/Workshop.
> **Prerrequisito:** EPIC 1 ✅
> **Roles involucrados:** 🎲 DM/Creador (crea packs), 👤 Jugador (usa assets), 👁️ Visitante (explora marketplace)
> **Visión estratégica:** Inspirado en Steam Workshop (agent-context.md §3.1, §4.0 línea 167-168)

#### US-5.1 — Ver marketplace de packs 🔶

> Como **visitante o usuario**, quiero explorar el marketplace de packs publicados, para descubrir contenido creado por la comunidad.

**Implementación existente:**
- [x] `Marketplace.tsx` — listado de packs públicos
- [ ] Paginación server-side
- [ ] Filtros por sistema, tipo, autor, popularidad
- [ ] Búsqueda por nombre

---

#### US-5.2 — Crear un pack de contenido ✅

> Como **creador**, quiero crear un pack de contenido con nombre, descripción, sistema y tipo, para compartir mis creaciones con la comunidad.

**Implementación:**
- [x] `CreatePack.tsx` — formulario de creación
- [x] Backend: `CreatePackUseCase`
- [x] Entity `ContentPack` con slug auto-generado

---

#### US-5.3 — Editar mi pack ✅

> Como **creador**, quiero editar el nombre, descripción y configuración de mi pack, para mejorarlo iterativamente.

**Implementación:**
- [x] `EditPack.tsx` — formulario pre-poblado
- [x] Backend: `UpdatePackUseCase` con ownership validation
- [x] Solo el creator o admin pueden editar

---

#### US-5.4 — Ver detalle de un pack con assets ✅

> Como **usuario**, quiero ver el detalle de un pack con todos sus assets (razas, clases, items), para decidir si quiero instalarlo en mi campaña.

**Implementación:**
- [x] `PackDetails.tsx` — información del pack + listado de assets
- [x] Backend: `GetPackUseCase`, `ListAssetsUseCase`
- [x] Assets desplegados con tipo, nombre y datos

---

#### US-5.5 — Agregar y editar assets dentro de un pack ✅

> Como **creador**, quiero agregar y editar assets (razas, clases, hechizos, etc.) dentro de mi pack, para construir contenido jugable.

**Implementación:**
- [x] Endpoints CRUD: `POST/GET/PUT/DELETE /packs/:slug/assets`
- [x] Backend: `CreateAssetUseCase`, `UpdateAssetUseCase`, `DeleteAssetUseCase`
- [x] `ResolveAssetUseCase` para resolver choices dinámicos
- [x] Soporte para 28 tipos de asset (AssetType enum)

---

#### US-5.6 — Ver mi biblioteca de packs ✅

> Como **creador**, quiero ver todos los packs que he creado en una sola página, para gestionar mi contenido.

**Implementación:**
- [x] `Library.tsx` — "Mis packs"
- [x] Backend: `ListPacksUseCase` filtrado por `creator_id`

---

#### US-5.7 — Buscar y filtrar packs en marketplace ⬜

> Como **usuario**, quiero buscar packs por nombre y filtrar por sistema/tipo/autor, para encontrar exactamente el contenido que necesito.

**Tareas:**
- [ ] Barra de búsqueda con debounce
- [ ] Filtros: sistema (D&D 5e, etc.), tipo (rules, adventure, homebrew), autor
- [ ] Paginación server-side con cursores
- [ ] Backend: extender `GET /packs` con query params

---

#### US-5.8 — Publicar o despublicar mi pack ⬜

> Como **creador**, quiero publicar mi pack para que sea visible en el marketplace, y poder despublicarlo si quiero hacerle cambios.

**Tareas:**
- [ ] Flujo: draft → published (bidireccional para v1, con review en v2)
- [ ] Backend: `PATCH /packs/:slug/status` ya existe parcialmente
- [ ] UI: botón "Publicar" / "Despublicar" en PackDetails o Library
- [ ] Packs en draft solo visibles por el creador

---

### EPIC 6: Inventario y Equipo del Personaje

> **Objetivo:** Gestión de equipo, items e inventario del personaje dentro de la campaña.
> **Prerrequisito:** EPIC 4 ✅
> **Visión estratégica:** Hoja de personaje completa con equipo interactivo (agent-context.md §2.0)

#### US-6.1 — Ver inventario de mi personaje ⬜

> Como **jugador**, quiero ver el inventario de mi personaje organizado por categoría, para saber qué items tengo y cuánto peso cargo.

**Tareas:**
- [ ] Decidir modelo: `inventory` (jsonb) en characters vs tabla dedicada `character_items`
- [ ] Mostrar items del SRD base (equipment assets de packs instalados)
- [ ] Vista: nombre, cantidad, peso, equipado/guardado
- [ ] Peso total vs capacidad de carga (STR × 15)

---

#### US-6.2 — Añadir o quitar items del inventario ⬜

> Como **jugador o DM**, quiero añadir items existentes de los packs de mi campaña al inventario, y quitar los que ya no tengo.

**Tareas:**
- [ ] Selector de items disponibles (filtrado por packs instalados)
- [ ] Controles +/- cantidad
- [ ] Backend: endpoint para CRUD de inventory items

---

#### US-6.3 — Equipar y desequipar items ⬜

> Como **jugador**, quiero equipar armas y armaduras en los slots correspondientes, para que afecten mis stats de combate.

**Tareas:**
- [ ] Slots: main hand, off hand, armor, shield, etc.
- [ ] Validaciones de tipo (no equipar espada como armadura)
- [ ] Visual: silhoueta de personaje con slots

---

#### US-6.4 — Ver efecto del equipo en stats ⬜

> Como **jugador**, quiero ver cómo mi equipo equipado afecta mi AC, daño y otros stats, para tomar decisiones tácticas informadas.

**Tareas:**
- [ ] Cálculo automático de AC basado en armadura + DEX modifier
- [ ] Mostrar daño de arma equipada
- [ ] Items mágicos: attunement, charges, límite 3 simultáneos

---

## Sprint 3: Tablero

> **Objetivo:** Mesa Virtual de Juego (VTT) — el corazón del producto. Sesiones de juego, canvas interactivo, tokens, dados, chat en tiempo real.
> **Prerrequisito:** Sprint 2 completado (Campañas + Personajes mínimo)
> **Visión estratégica:** Accesibilidad radical, herramienta invisible, Teatro de la Mente como modo principal (agent-context.md §2.0, §3.0)

---

### EPIC 7: Sesiones de Juego

> **Objetivo:** Programar, iniciar y gestionar sesiones de juego dentro de una campaña.
> **Roles involucrados:** 🎲 DM (programa y dirige), 👤 Jugador (participa)

#### US-7.1 — Crear y programar una sesión de juego ⬜

> Como **DM**, quiero programar una sesión de juego con fecha, hora y notas, para que mis jugadores sepan cuándo es la próxima partida.

**Tareas:**
- [ ] Entidad `Session`: campaignId, scheduledAt, status (scheduled/active/completed), notes
- [ ] Backend: CRUD endpoints para sessions
- [ ] Frontend: formulario de creación dentro de CampaignDetails

---

#### US-7.2 — Ver listado de sesiones (próximas e historial) ⬜

> Como **miembro de una campaña**, quiero ver las sesiones programadas y las sesiones pasadas, para planificar y recordar lo jugado.

**Tareas:**
- [ ] Sección "Sesiones" en CampaignDetails
- [ ] Lista separada: Próximas (ordenadas por fecha) y Historial
- [ ] Estado visual: scheduled (azul), active (verde), completed (gris)

---

#### US-7.3 — Iniciar sesión en vivo ⬜

> Como **DM**, quiero iniciar una sesión programada para que todos los jugadores se conecten a la mesa virtual en tiempo real.

**Tareas:**
- [ ] Cambio de estado: scheduled → active (solo DM)
- [ ] Redirect o notificación a jugadores
- [ ] Abrir la vista de mesa virtual (VTT Canvas o Teatro de la Mente)

---

#### US-7.4 — Ver resumen de sesiones pasadas ⬜

> Como **miembro de una campaña**, quiero ver las notas y resumen de sesiones pasadas, para refrescar mi memoria antes de la próxima sesión.

**Tareas:**
- [ ] Campo `notes` editable por DM (markdown)
- [ ] Vista de resumen con fecha, duración, participantes
- [ ] Base para futuro "Diario automático de campaña" con IA (US-11.2)

---

### EPIC 8: Mesa Virtual (VTT Core)

> **Objetivo:** Experiencia de juego en tiempo real con chat, dados, mapa y ficha de personaje.
> **Prerrequisito:** EPIC 7
> **Decisión:** WebSocket con modelo Last-Write-Wins. DM tiene autoridad absoluta.
> **Filosofía:** "La tecnología no debe interponerse" (agent-context.md §3.0). Priorizar chat y dados sobre animaciones.

#### US-8.1 — Chat en tiempo real en sesión ⬜

> Como **miembro de una sesión activa**, quiero enviar y recibir mensajes en tiempo real, para comunicarme durante la partida.

**Tareas:**
- [ ] Infraestructura WebSocket: Elysia WS, rooms por sesión, auth por JWT
- [ ] Canales: general, whisper DM (privado entre DM y jugador), in-character
- [ ] Mensajes persistidos en BD: sessionId, userId, channel, content, timestamp
- [ ] UI: chat con tabs por canal, indicador "escribiendo..."
- [ ] Heartbeat + reconnect automático

---

#### US-8.2 — Tirar dados virtuales ⬜

> Como **jugador o DM**, quiero tirar dados con notación estándar (2d6+3, 1d20 con ventaja) y que todos vean el resultado, para resolver acciones del juego.

**Tareas:**
- [ ] Parser de notación: NdX+Y, kh/kl (ventaja/desventaja), drop lowest
- [ ] Resultado broadcasted via WebSocket a todos los miembros de la sesión
- [ ] Historial de tiradas visible en el chat
- [ ] Comando `/roll <notación>` desde el input de chat
- [ ] Visual: animación de dados con resultado final

---

#### US-8.3 — Ver mapa 2D interactivo ⬜

> Como **jugador**, quiero ver un mapa táctico compartido donde el DM muestra la escena, para visualizar el entorno y posicionar a mi personaje.

**Tareas:**
- [ ] Upload de mapa por DM → Supabase Storage
- [ ] Canvas: evaluar Pixi.js vs Konva.js
- [ ] Grid configurable: cuadrado o hexagonal con snap-to-grid
- [ ] Zoom, pan, herramienta regla de distancias
- [ ] Compresión automática a WebP en frontend, límite 10MB backend

---

#### US-8.4 — Mover mi token en el mapa ⬜

> Como **jugador**, quiero mover mi ficha/token en el mapa, para indicar mi posición durante combate o exploración.

**Tareas:**
- [ ] Token = imagen circular con borde de color, arrastrable
- [ ] Sincronización via WebSocket (modelo autoritativo Last-Write-Wins)
- [ ] DM puede mover todos los tokens; jugador solo el suyo
- [ ] Snap-to-grid con animación suave

---

#### US-8.5 — (DM) Controlar Fog of War ⬜

> Como **DM**, quiero revelar y ocultar zonas del mapa, para controlar qué ven mis jugadores y mantener el suspense.

**Tareas:**
- [ ] Capa de ocultamiento sobre el mapa
- [ ] Herramienta "revelar" con brocha (DM only)
- [ ] Estado del fog persistido por sesión
- [ ] Jugadores no ven zonas no reveladas; DM ve todo

---

#### US-8.6 — Ver y editar ficha de personaje en sesión ⬜

> Como **jugador en sesión**, quiero abrir mi hoja de personaje en un panel lateral para consultar stats, ajustar HP y ver mi inventario sin salir de la mesa.

**Tareas:**
- [ ] Panel lateral colapsable con ficha del personaje
- [ ] Cambios de HP/inventario sincronizados via WebSocket
- [ ] DM puede ver y editar cualquier ficha
- [ ] Diseño compacto optimizado para pantalla dividida

---

#### US-8.7 — Modo Teatro de la Mente (sin mapa) ⬜

> Como **DM**, quiero dirigir una sesión sin mapa táctico, usando solo narrativa, dados y chat, para sesiones más ágiles y centradas en la historia.

**Tareas:**
- [ ] Vista alternativa al canvas: solo chat + dados + fichas de personajes
- [ ] Fondos ambientales opcionales (imágenes de ambiente, no mapas tácticos)
- [ ] Sonido ambiental opcional (lluvia, taberna, bosque)
- [ ] Filosofía: "Menos configuración, más juego" (agent-context.md §4.0 nota final)

---

## Sprint 4: Comunidad e IA

> **Objetivo:** Features de crecimiento — marketplace completo, buscador de partidas, IA como copiloto del DM.
> **Prerrequisito:** Sprint 3 completado (VTT funcional)

---

### EPIC 9: Marketplace Completo (Workshop)

> **Objetivo:** Steam Workshop para TTRPGs — publicación, búsqueda, instalación y valoración de packs creados por la comunidad.
> **Visión estratégica:** "Mercado de Creadores Simplificado" con barrera de entrada baja (agent-context.md §3.1 línea 41). Creadores pueden publicar y monetizar.

#### US-9.1 — Publicar pack con flujo de revisión ⬜

> Como **creador**, quiero enviar mi pack a revisión y recibir feedback antes de que sea público, para asegurar calidad en el marketplace.

**Tareas:**
- [ ] Flujo: draft → submitted → under_review → published (o rejected con feedback)
- [ ] UI de estado en PackDetails y Library
- [ ] Panel de admin para revisar packs pendientes

---

#### US-9.2 — Buscar y filtrar packs avanzado ⬜

> Como **usuario**, quiero buscar packs con filtros avanzados y ordenamiento, para encontrar exactamente el contenido que necesito para mi campaña.

**Tareas:**
- [ ] Filtros: sistema, tipo, rating, popularidad (instalaciones), autor, precio (futuro)
- [ ] Ordenamiento: relevancia, recientes, más populares, mejor valorados
- [ ] Paginación server-side
- [ ] UI: faceted search con sidebar de filtros

---

#### US-9.3 — Instalar packs en mi biblioteca personal ⬜

> Como **usuario**, quiero instalar packs del marketplace en mi biblioteca personal, para tenerlos disponibles al crear campañas.

**Tareas:**
- [ ] Relación many-to-many `user_installed_packs`
- [ ] Botón "Instalar en mi biblioteca" en PackDetails
- [ ] Sección "Instalados" vs "Creados por mí" en Library

---

#### US-9.4 — Dashboard de creador con estadísticas ⬜

> Como **creador**, quiero ver estadísticas de mis packs (instalaciones, valoraciones, popularidad), para entender cómo recibe la comunidad mi contenido.

**Tareas:**
- [ ] Ruta: `/workshop` con tabs: Mis Packs, Estadísticas
- [ ] Métricas: instalaciones totales, rating promedio, tendencia

---

#### US-9.5 — Valorar y reseñar packs ⬜

> Como **usuario**, quiero dar una puntuación y escribir una reseña de un pack que uso, para ayudar a otros usuarios a elegir contenido de calidad.

**Tareas:**
- [ ] Entidad `Review`: userId, packId, rating (1-5), comment
- [ ] Una review por usuario por pack
- [ ] Rating promedio visible en cards del marketplace
- [ ] Backend: CRUD endpoints para reviews

---

### EPIC 10: Buscador de Partidas

> **Objetivo:** Motor de crecimiento comunitario. Conectar jugadores con DMs.
> **Prerrequisito:** EPIC 3 ✅
> **Visión estratégica:** "Buscador de Partidas Integrado" como uno de los should-haves clave (agent-context.md §3.3 línea 51)

#### US-10.1 — Publicar mi campaña como partida abierta ⬜

> Como **DM**, quiero publicar mi campaña en el buscador de partidas con horario, idioma, estilo y plazas disponibles, para encontrar nuevos jugadores.

**Tareas:**
- [ ] Entidad `GameListing`: campaignId, description, schedule, system, level, language, style, maxPlayers, status
- [ ] Solo DMs con campaña activa pueden publicar
- [ ] Backend: CRUD endpoints para game listings

---

#### US-10.2 — Buscar partidas por sistema, horario e idioma ⬜

> Como **jugador**, quiero buscar partidas abiertas filtrando por sistema, horario, idioma y nivel, para encontrar un grupo que se ajuste a mi disponibilidad.

**Tareas:**
- [ ] Filtros múltiples + paginación
- [ ] Cards con info resumida + botón "Solicitar Unirse"
- [ ] Ordenamiento: por fecha, por relevancia, por popularidad

---

#### US-10.3 — Solicitar unirse a una partida ⬜

> Como **jugador**, quiero enviar una solicitud para unirme a una partida publicada, y que el DM pueda aceptar o rechazar mi solicitud.

**Tareas:**
- [ ] Flujo: solicitud → notificación al DM → aprobación → auto-agregar como miembro → notificación al jugador
- [ ] Rechazo con motivo opcional
- [ ] DM puede ver el perfil del solicitante antes de decidir

---

### EPIC 11: Asistente IA para el DM

> **Objetivo:** IA como copiloto del DM — asistencia, generación, resúmenes. El DM humano tiene control total.
> **Prerrequisito:** Sprint 3 completado (VTT funcional)
> **Filosofía:** "La IA no es el jefe, es el secretario" (agent-context.md §4.0). Sugiere, no decide. Botón "Aprobar/Editar" siempre presente.
> **Arquitectura:** Capa Lógica (determinista, hard-coded) + Capa Narrativa (LLM con supervisión humana)

#### US-11.1 — Generar NPC con IA desde la campaña ⬜

> Como **DM**, quiero generar un NPC con personalidad, apariencia y motivaciones usando IA, para preparar partidas más rápido sin sacrificar calidad narrativa.

**Tareas:**
- [ ] Integración API LLM (Claude/GPT) con contexto de campaña
- [ ] DM edita resultado antes de guardar
- [ ] NPC se guarda como asset en un pack de la campaña
- [ ] UI: botón "Generar NPC con IA" en CampaignDetails

---

#### US-11.2 — Diario automático de campaña ⬜

> Como **miembro de una campaña**, quiero que se genere automáticamente un resumen de cada sesión, para no perder el hilo de la historia entre sesiones.

**Tareas:**
- [ ] Resumen generativo post-sesión basado en chat + tiradas + notas de DM
- [ ] DM edita/aprueba antes de publicar a los miembros
- [ ] Sistema RAG para memoria a largo plazo: NPCs, eventos, lugares
- [ ] Visible como "Diario" en CampaignDetails
- [ ] Pregunta "¿Dónde quedamos?" con respuesta contextual (agent-context.md §5.0)

---

#### US-11.3 — Tutorial interactivo para nuevos jugadores ⬜

> Como **jugador nuevo**, quiero un tutorial interactivo guiado por IA que me enseñe a jugar D&D paso a paso, para aprender sin depender de un DM humano.

**Tareas:**
- [ ] Aventura tutorial de 5-7 escenas con IA como DM
- [ ] Explica mecánicas en contexto (tirada de dados, checks, combate)
- [ ] Botón "Explicar esto" para reglas complejas (agent-context.md §3.3)
- [ ] Progresión gradual: primero narrativa simple, luego combate, luego exploración
- [ ] Entorno seguro y accesible para jugadores nuevos (agent-context.md §4.0 línea 165)

---

## Sprint 5+: Post-MVP

> **Objetivo:** Funcionalidades que requieren validación con usuarios reales antes de invertir.
> **Visión estratégica:** PWA, accesibilidad, voice UI, DM IA autónomo (agent-context.md §3.3, §4.0, §5.0)

---

### EPIC 12: UX Avanzada y Plataforma

> **Objetivo:** Notificaciones, mobile, offline, accesibilidad — la plataforma como producto pulido.

#### US-12.1 — Sistema de notificaciones ⬜

> Como **usuario**, quiero recibir notificaciones cuando me inviten a una campaña, cuando una sesión esté próxima, o cuando aprueben mi solicitud de unirme, para estar al tanto de lo que pasa en mis partidas.

**Tareas:**
- [ ] Entidad `Notification`: userId, type, content, read, createdAt
- [ ] Bell icon en navbar con badge de no leídas
- [ ] Push notifications (web) opcionales
- [ ] Eventos: invitación a campaña, sesión próxima, respuesta a solicitud, pack aprobado

---

#### US-12.2 — App móvil / PWA ⬜

> Como **jugador**, quiero usar QuestMasters desde mi celular sin instalar nada, para participar en sesiones desde cualquier lugar.

**Tareas:**
- [ ] Service worker + manifest.json (PWA)
- [ ] Diseño responsive con thumb zone (agent-context.md §5.0 línea 152)
- [ ] Controles gestuales para dados y mapa (swipe, pinch zoom)
- [ ] Optimización para conexiones lentas

---

#### US-12.3 — Modo offline ⬜

> Como **jugador**, quiero consultar mi ficha de personaje y notas de campaña sin conexión, para preparar mis partidas en cualquier momento.

**Tareas:**
- [ ] Dexie.js o IndexedDB para cache local
- [ ] Cola de sync para cambios offline
- [ ] Resolución de conflictos (last-write-wins)

---

#### US-12.4 — Accesibilidad avanzada ⬜

> Como **jugador con discapacidad visual o motora**, quiero que la plataforma sea usable con lector de pantalla, alto contraste y navegación por teclado, para disfrutar del rol como cualquier otro jugador.

**Tareas:**
- [ ] Modo alto contraste y tema oscuro/claro con toggle (agent-context.md §5.0 línea 147)
- [ ] Semántica ARIA completa
- [ ] Navegación por teclado en todos los controles
- [ ] Fuentes legibles con escalado configurable

---

### EPIC 13: Click & Play — DM IA Autónomo

> **Objetivo:** IA que dirige partidas completas para jugadores sin DM humano — el "santo grial" de la asistencia al rol.
> **Prerrequisito:** Sprint 4 (EPIC 11 validada con usuarios reales)
> **Visión estratégica:** "Juego Instantáneo" (agent-context.md §4.0 línea 65-66) — "Start adventure" con un solo clic.

#### US-13.1 — Iniciar aventura instantánea (Click & Play) ⬜

> Como **jugador nuevo o casual**, quiero iniciar una aventura de D&D inmediatamente con un solo clic, sin necesitar un DM humano, para jugar cuando quiera.

**Tareas:**
- [ ] Capa lógica determinista (reglas hard-coded, HP, combate, stats)
- [ ] Capa narrativa IA (descripción de escenas, diálogos de NPCs, consecuencias narrativas)
- [ ] Input: "Start adventure" o frase "Inicia una aventura de 90 min en una taberna"
- [ ] Mundo persistente con "archivo infinito" (RAG)
- [ ] Generación dinámica de contenido (monstruos, items, puzles)

---

#### US-13.2 — Compañeros IA opcionales ⬜

> Como **jugador solitario**, quiero que la IA controle compañeros de grupo que me apoyen, para disfrutar de una experiencia de grupo completa jugando solo.

**Tareas:**
- [ ] Compañeros IA con personalidad diferenciada
- [ ] No roban protagonismo al jugador humano
- [ ] Ayudan en combate y contribuyen a la narrativa
- [ ] Decisiones tácticas básicas automáticas

---

#### US-13.3 — Voice UI bidireccional ⬜

> Como **jugador móvil**, quiero hablar con la IA y escuchar sus respuestas por voz, para jugar con las manos libres.

**Tareas:**
- [ ] Speech-to-Text para dictado de acciones (agent-context.md §5.0 línea 142)
- [ ] Text-to-Speech con voces diferenciadas por NPC (ElevenLabs o similar)
- [ ] Modo "Radio": escuchar resumen mientras caminas (agent-context.md §5.0 línea 143)

---

## Mapa de Dependencias

```
Sprint 1: Bases
├── EPIC 0: Infraestructura ✅ (~85%)
├── EPIC 1: Auth ✅ (~85%)
└── EPIC 2: Perfiles ✅ (~95%)

Sprint 2: Juego (REQUIERE Sprint 1)
├── EPIC 3: Campañas ✅ (100%)
├── EPIC 4: Personajes 🔶 (~70%) — backend/builder ✅, módulo UI ⬜
├── EPIC 5: Packs/Contenido 🔶 (~70%) — CRUD ✅, búsqueda/publicación ⬜
└── EPIC 6: Inventario ⬜ (0%) — requiere EPIC 4

Sprint 3: Tablero (REQUIERE Sprint 2)
├── EPIC 7: Sesiones ⬜ (0%)
└── EPIC 8: Mesa Virtual ⬜ (0%) — requiere EPIC 7

Sprint 4: Comunidad e IA (REQUIERE Sprint 3)
├── EPIC 9: Marketplace Completo ⬜ (~5%) — extiende EPIC 5
├── EPIC 10: Buscador de Partidas ⬜ (0%) — requiere EPIC 3
└── EPIC 11: IA para DM ⬜ (0%) — requiere VTT funcional

Sprint 5+: Post-MVP
├── EPIC 12: UX Avanzada ⬜ (0%)
└── EPIC 13: Click & Play ⬜ (0%) — requiere EPIC 11 validada
```

---

## Próximos Pasos Recomendados

### Prioridad Inmediata (Sprint 2 — completar)

1. **US-4.6** → Página "Mis Personajes" — módulo UI independiente que actualmente no existe
2. **US-4.7** → Ficha individual de personaje — CharacterSheet
3. **US-5.7** → Búsqueda y filtrado en marketplace
4. **US-5.8** → Flujo de publicación de packs

### Siguiente (Sprint 2 — inventario o Sprint 3 — sesiones)

5. **US-7.1 → US-7.4** → Sesiones de juego (prerequisito del VTT)
6. **US-6.1 → US-6.4** → Inventario (completa la ficha de personaje)

> **Regla:** Ejecutar cada US individualmente. Verificar compilación y tests antes de avanzar.

---

## Tabla de Mapeo: IDs Anteriores → Nuevos

> Para trazabilidad con commits y PRs existentes que referencian IDs del backlog anterior.

| ID Anterior | Descripción anterior | ID Nuevo | Descripción nueva |
|---|---|---|---|
| US-0.1 | CI/CD con GitHub Actions | US-0.1 | CI/CD automático |
| US-0.2 | Migraciones de base de datos | US-0.2 | Base de datos con migraciones |
| US-0.3 | Tests unitarios base | US-0.5 | Cobertura de tests base |
| US-0.4 | Swagger/OpenAPI | US-0.3 | Documentación de API |
| US-0.5 | Docker multi-stage | US-0.4 | Contenedorización Docker |
| US-0.6 | Observabilidad | US-0.6 | Observabilidad y logging |
| US-0.7 | Validación de env | US-0.7 | Validación de configuración |
| US-1.1 | Registro + Login email/password | US-1.1 + US-1.2 | Registro + Login (separados) |
| US-1.2 | AuthContext en frontend | US-1.4 | Protección de rutas (incluye AuthContext) |
| US-1.3 | Guards de seguridad backend | US-1.4 | Protección de rutas (incluye guards) |
| US-1.4 | Rate limiting | — | Absorbido en infraestructura |
| US-1.5 | CORS configurado | — | Absorbido en infraestructura |
| US-1.6 | OAuth providers | US-1.5 + US-1.6 | Google + Discord (separados) |
| US-1.7 | Token refresh automático | US-1.7 | Renovación automática de sesión |
| US-1.8 | AuthActionGuard | US-1.8 | Feedback para usuarios invitados |
| US-2.1 | UserProfile CRUD | US-2.1 | Ver y editar mi perfil |
| US-2.2 | Sistema de roles | — | Absorbido en infraestructura/guards |
| US-2.3 | Página de perfil | US-2.1 | Fusionado con perfil CRUD |
| US-2.4 | Username único | US-2.3 | Username único con validación |
| US-2.5 | Avatar upload | US-2.2 | Subir avatar personalizado |
| US-2.6 | Sidebar con identidad | US-2.5 | Sidebar con identidad del usuario |
| US-2.7 | GuestBanner | US-2.6 | Banner informativo para invitados |
| US-2.8 | Búsqueda de usuarios | US-2.4 | Buscar otros usuarios |
| US-3.1 | Campaign entity + CRUD backend | US-3.1 | Crear una nueva campaña |
| US-3.2 | Campaign CRUD frontend | US-3.1→3.5 | Distribuido en US por acción visible |
| US-3.3 | Campaign installed packs | US-3.11 + US-3.12 | Instalar + Desinstalar packs |
| US-3.4 | Campaign portrait upload | US-3.7 | Subir portada de campaña |
| US-3.5 | Campaign status management | US-3.6 | Cambiar estado de campaña |
| US-3.6 | Invitar jugadores | US-3.8 | Invitar jugadores a campaña |
| US-3.7 | Remover jugadores | US-3.9 | Remover jugadores de campaña |
| US-3.8 | Listar miembros | US-3.10 | Ver miembros de la campaña |
| US-3.9 | Frontend service layer | — | Absorbido como tarea técnica |
| US-4.1 | Point Buy en dnd-rules | US-4.1 | Subtarea técnica de "Crear personaje" |
| US-4.2 | Migration: tabla characters | US-4.1 | Subtarea técnica de "Crear personaje" |
| US-4.3 | Character entity, VOs, Repository | US-4.1 | Subtarea técnica de "Crear personaje" |
| US-4.4 | TypeORM entity, Repository, Mapper | US-4.1 | Subtarea técnica de "Crear personaje" |
| US-4.5 | Use Cases: CRUD + Validaciones | US-4.1→4.5 | Distribuido en US por acción visible |
| US-4.6 | Backend Routes + Schemas | US-4.1→4.5 | Subtarea técnica de cada US |
| US-4.7 | Frontend: Character Builder | US-4.1 | Crear un personaje para mi campaña |
| US-4.8 | Frontend: CampaignDetails + Edit | US-4.2→4.4 | Ver en campaña, Editar, DM gestiona |
| US-5.1→5.4 | Inventario (futuro) | US-6.1→6.4 | EPIC 6: Inventario |
| US-6.1→6.6 | Canvas y Mesa Virtual | US-8.1→8.7 | EPIC 8: Mesa Virtual |
| US-7.1→7.4 | Fichas en Sesión | US-8.4→8.6 | Fusionado en EPIC 8 |
| US-8.1→8.5 | Marketplace y Workshop | US-9.1→9.5 | EPIC 9: Marketplace Completo |
| US-9.1→9.3 | Buscador de Partidas | US-10.1→10.3 | EPIC 10: Buscador de Partidas |
| US-10.1→10.3 | DM Asistido por IA | US-11.1→11.3 | EPIC 11: IA para DM |
| US-POST.1 | Click & Play | US-13.1 | Click & Play — DM IA Autónomo |
| US-POST.2 | Audio/Video (WebRTC) | — | Eliminado (usuarios usan Discord) |
| US-POST.3 | Offline-First | US-12.3 | Modo offline |
| US-POST.4 | Voice TTS/STT | US-13.3 | Voice UI bidireccional |
| US-POST.5 | Compañeros IA | US-13.2 | Compañeros IA opcionales |
| US-POST.6 | PWA + Mobile | US-12.2 | App móvil / PWA |
