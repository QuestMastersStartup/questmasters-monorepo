# Diseño: Rediseño de Interfaz de Personaje

**Fecha:** 2026-06-15
**Estado:** Aprobado — pendiente de implementación

---

## Contexto y problema

La interfaz actual de personaje tiene tres problemas estructurales:

1. **Fragmentación:** `CreateCharacter` (crear + editar) y `CharacterDetail` (ver) son páginas completamente distintas con layouts divergentes. El usuario experimenta saltos visuales al cambiar de modo.
2. **Ausencia de información:** Las AssetCards muestran solo el nombre y hasta 3 chips de traits sin descripción. El usuario selecciona raza, clase y trasfondo sin saber qué está eligiendo — requiere conocimiento previo de D&D.
3. **Campos incompletos:** No existe UI para seleccionar competencias en habilidades, ni explicaciones de qué hacen los atributos (FUE/DES/etc.), ni detalles de rasgos raciales o características de clase.

---

## Decisiones de diseño

| Pregunta | Decisión |
|----------|----------|
| ¿Unificar ver/editar? | Layout compartido, rutas distintas (B) |
| ¿Navegación interna? | Tabs horizontales (A) |
| ¿Detalles de assets? | Botón ⓘ separado abre modal (C) |
| ¿Enriquecimiento de contenido? | Enriquecer seed SRD — dato canónico en D1 (A) |

---

## Arquitectura

### Rutas

```
/characters/new?system=dnd-5e-2014&mode=vanilla   → CreateCharacter   (isNew=true,  readOnly=false)
/characters/:id                                    → CharacterDetail   (isNew=false, readOnly=true)
/characters/:id/edit                               → CharacterEdit     (isNew=false, readOnly=false)
/campaigns/:id/characters/new                      → CreateCharacter   (isNew=true,  readOnly=false, campaignId)
```

### Componente central: `CharacterShell`

Las tres páginas son thin wrappers que renderizan `CharacterShell`:

```tsx
interface CharacterShellProps {
  readOnly: boolean;
  isNew: boolean;
  initialData?: Character;        // undefined en creación
  assets: AvailableAssetsResult;
  onSubmit: (data: CharacterFormData) => Promise<void>;
}
```

El shell mantiene todo el estado del formulario y lo distribuye a cada tab. Los tabs son stateless — reciben valores + callbacks.

### Estructura de archivos

```
apps/frontend/src/
  pages/
    CreateCharacter.tsx          ← thin wrapper, llama createCharacter()
    CharacterDetail.tsx          ← thin wrapper, readOnly=true
    CharacterEdit.tsx            ← thin wrapper, llama updateCharacter()

  components/features/characters/
    CharacterShell.tsx           ← header + TabBar + renderiza tab activo
    tabs/
      IdentityTab.tsx
      OriginTab.tsx
      AttributesTab.tsx
      SkillsTab.tsx
      BackstoryTab.tsx
      ExtraTab.tsx
    AssetCard.tsx                ← enriquecida con botón ⓘ
    AssetDetailModal.tsx         ← modal de detalles por tipo de asset (nuevo)
    AbilityPopover.tsx           ← popover de descripción de atributo (nuevo)
    SkillRow.tsx                 ← fila de habilidad con toggle (nuevo)
    StatCounter.tsx              ← sin cambios estructurales

  lib/srd-static/
    ability-scores.ts            ← 6 atributos: full_name, desc, skills asociadas
    skills.ts                    ← 18 habilidades: desc, ability_score
```

---

## Navegación: 6 Tabs

| # | Tab | Contenido principal | Indicador |
|---|-----|---------------------|-----------|
| 1 | **Identidad** | Nombre, retrato, nivel, status, HP, XP, método stats | Badge de modo |
| 2 | **Origen** | Raza · Subraza · Clase · Subclase · Trasfondo | Badges de selección activa |
| 3 | **Atributos** | 6 puntuaciones + modificadores + stats derivados | Puntos restantes (point-buy) |
| 4 | **Habilidades** | 18 habilidades con checkboxes de competencia + bonus | N.º competencias activas |
| 5 | **Trasfondo** | Rasgos narrativos (rasgo, personalidad, ideales, vínculos, defectos) + historia | — |
| 6 | **Extra** | Alineamiento, edad, apariencia, idiomas, notas, metadata | — |

### Barra de tabs

- Sticky debajo del header, encima del contenido del tab activo
- Tab activo: borde inferior indigo + texto blanco
- Mobile: `overflow-x-auto` con scroll horizontal — no colapsa
- Transición entre tabs: fade-in 100ms; el contenido se oculta con `hidden` (no desmonta) para preservar el estado del formulario

### Header del shell

```
← Volver    [Retrato 48px]  Nombre del Personaje         [Editar] / [Guardar]
                             Nivel 5 · Humano · Guerrero
```

- `readOnly=true`: botones **Editar** + **Eliminar**
- `readOnly=false`: botón **Guardar / Forjar** (siempre visible, disabled mientras `submitting`)
- El retrato en el header es el trigger de upload en modo edición
- Errores de validación: toast en la parte superior del shell, no dentro de un tab
- Tabs con campos inválidos al intentar guardar: punto rojo `●` en el label del tab + scroll/focus al primer campo inválido

---

## Tab 2 — Origen y Modal ⓘ

### Layout

Dos columnas en desktop, una en mobile:

- Columna izquierda: Raza → Subraza (condicional)
- Columna derecha: Clase → Subclase (condicional)
- Fila inferior: Trasfondo (grid 2 col)

En modo libre (`mode === 'libre'`): los selectores de AssetCards se reemplazan por inputs de texto (comportamiento actual).

### AssetCard enriquecida

La card tiene dos zonas de interacción explícitas:

- **Área principal** (todo excepto el botón ⓘ): selecciona / deselecciona el asset
- **Botón ⓘ** (esquina superior derecha, siempre visible): abre `AssetDetailModal` sin modificar la selección

Contenido visible en la card:
- Raza: nombre, bonos de atributo (`CON +2`), velocidad, tags de traits (hasta 3)
- Clase: nombre, dado de golpe (`d12`), tags de atributo primario
- Trasfondo: nombre, competencias de habilidad
- Estado seleccionado: borde indigo + check ✓

### AssetDetailModal — contenido por tipo

**Raza:**
- Velocidad, tamaño, bonos de atributo
- Texto de alineamiento y edad (del SRD)
- Lista de rasgos raciales con descripción completa (embebida en `asset.data.traits`)
- Idiomas
- Lista de subrazas disponibles

**Clase:**
- Dado de golpe, atributo primario, tiradas de salvación
- Competencias: armaduras, armas, herramientas
- Opciones de habilidades (`proficiency_choices`: "elige 2 de estas 6")
- Rasgos de clase de nivel 1 (y nivel 2 si aplica)
- Lista de subclases disponibles

**Subclase:**
- Clase padre
- Descripción de la subclase
- Rasgos de subclase

**Trasfondo:**
- Competencias de habilidad e idiomas
- Equipo inicial
- Rasgo especial (nombre + descripción completa)
- Sugerencias de personalidad, ideales, vínculos, defectos (desplegables)

**Origen de los datos:** todo desde `asset.data` — sin llamadas adicionales al backend.

---

## Tab 3 — Atributos

### Layout

- Switch de método en la parte superior: `Point Buy (27 pts)` / `Libre (1-30)`
- Grid 3×2 de StatCounters (igual que hoy)
- Debajo de cada StatCounter: chips de skills asociadas (informativos, no interactivos)
- Fila de stats derivados (read-only): HP máx, Bono de competencia, Percepción pasiva, CA base

### Popover de atributo (botón ⓘ junto al label FUE/DES/etc.)

- Aparece en hover (desktop) / click (mobile)
- Contenido: `full_name`, descripción (2 párrafos del SRD), skills asociadas
- Se cierra al mover el cursor fuera o click externo
- Datos desde constante estática `ABILITY_SCORE_DESCRIPTIONS` en `src/lib/srd-static/ability-scores.ts`

---

## Tab 4 — Habilidades

### Layout

```
Ordenar por: [ Atributo ▼ ]    Competencias: 4 / 4 ✓
─────────────────────────────────────────────────────
FUERZA
☑  Atletismo        STR   +4   [Clase: Bárbaro]   ⓘ

DESTREZA
☐  Acrobacias       DEX   +1                      ⓘ
☐  Juego de Manos   DEX   +1                      ⓘ
☐  Sigilo           DEX   +1                      ⓘ
...
```

### Comportamiento de checkboxes

- `readOnly=true`: checkboxes visuales no interactivos
- `readOnly=false`:
  - Competencias fijas (de clase + trasfondo): pre-marcadas automáticamente, no desmarcables
  - Competencias opcionales (elecciones de clase): checkboxes activos dentro del límite permitido
  - Al exceder el límite: checkbox deshabilitado + tooltip "Límite alcanzado"
- Etiqueta de origen `[Clase: X]` / `[Trasfondo: Y]` en competencias automáticas

### Bonus calculado

```
bonus = modificador(atributo) + (tiene_competencia ? proficiency_bonus : 0)
```

Usa `calculateModifier` y `calculateProficiencyBonus` de `@questmasters/dnd-rules`.

### Popover ⓘ de habilidad

- Nombre + atributo asociado + descripción completa
- Datos desde constante estática `SKILL_DESCRIPTIONS` en `src/lib/srd-static/skills.ts`

---

## Tab 5 — Trasfondo

Campos en columna única:

1. **Historia del personaje** — textarea larga (backstory)
2. Separador
3. **Rasgo** — habilidad especial del trasfondo (auto-rellena desde trasfondo seleccionado)
4. **Rasgos de personalidad** — cómo piensa y habla
5. **Ideales** — en qué cree
6. **Vínculos** — qué lo une al mundo
7. **Defectos** — su debilidad o vicio

En `readOnly`: cada campo muestra su texto o un placeholder inmersivo en cursiva (comportamiento actual de `CharacterDetail`).

---

## Tab 6 — Extra

Campos opcionales:

- Alineamiento (select, 9 opciones)
- Edad (input número)
- Apariencia (textarea)
- Idiomas (input texto)
- Notas (textarea grande)

Metadata (siempre read-only):
- Sistema · Modo · Método de stats (mostrado como badges)

---

## Enriquecimiento del Seed SRD

El SRD está bajo licencia **CC BY 4.0** — sin restricciones de uso. El seed es la única fuente de verdad para el contenido canónico.

### Cambio 1: Clases

Reemplazar `scripts/data/classes.json` por `5e-SRD-Classes.json` en el seed. Campos a incluir en `asset.data`:

```js
{
  hit_die,
  saving_throws,              // ["Strength", "Constitution"]
  proficiencies,              // armaduras, armas, herramientas
  proficiency_choices,        // { choose: 2, from: [...6 skills] }
  starting_equipment,
  starting_equipment_options,
  class_levels_1_2: [...]     // features de nivel 1 y 2 desde 5e-SRD-Features.json
}
```

### Cambio 2: Razas

Durante el seed, enriquecer los traits de cada raza con descripciones desde `5e-SRD-Traits.json`:

```js
traits: raceData.traits.map(t => ({
  index: t.index,
  name: t.name,
  desc: srdTraits.find(td => td.index === t.index)?.desc ?? []
}))
```

Sin tabla adicional — las descripciones quedan embebidas en `asset.data`.

### Cambio 3: Trasfondos

Verificar que el seed incluya los campos completos de `5e-SRD-Backgrounds.json`:
`feature`, `personality_traits`, `ideal`, `bond`, `flaw`, `starting_proficiencies`, `starting_equipment`.

### Resultado

El payload de `fetchAvailableAssets` lleva todo lo necesario para los modales ⓘ. Sin endpoints adicionales, sin N+1 queries.

---

## Constantes estáticas en el frontend

Datos fijos del SRD que nunca cambian — copiados como constantes TypeScript:

**`src/lib/srd-static/ability-scores.ts`**
```ts
export const ABILITY_SCORE_DESCRIPTIONS = {
  strength: { fullName: 'Fuerza', desc: [...], skills: ['athletics'] },
  dexterity: { fullName: 'Destreza', desc: [...], skills: ['acrobatics', 'sleight-of-hand', 'stealth'] },
  // ...
}
```

**`src/lib/srd-static/skills.ts`**
```ts
export const SKILL_DESCRIPTIONS = {
  acrobatics: { name: 'Acrobacias', abilityScore: 'dexterity', desc: '...' },
  // ...18 habilidades
}
```

---

## Lo que NO cambia

- La lógica de `point-buy` y `calculateModifier`/`calculateHitPoints` de `@questmasters/dnd-rules` — sin cambios
- El endpoint `GET /api/characters/available-assets` — sin cambios
- El endpoint `POST /api/characters` y `PATCH /api/characters/:id` — sin cambios
- La estructura de la entidad `Character` y sus `choices` — sin cambios
- El modo libre (`mode === 'libre'`) — mismo comportamiento, solo reubicado en tabs

---

## Fuera de alcance

- Competencias en herramientas
- Trasfondo de hechizos / spellcasting
- Inventario / equipamiento inicial automatizado
- Expertise (doble competencia)
- Multiclase
- Cualquier contenido que no sea SRD 2014 vanilla
