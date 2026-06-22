# Plan: Sistema de Proficiencias en Creación de Personaje

## Contexto

Las tiradas de dados en DM Session necesitan saber las proficiencias del personaje para calcular correctamente (d20 + modifier + proficiency bonus). Actualmente no se capturan durante la creación. Los datos SRD ya tienen toda la info necesaria en `proficiency_choices` (clases) y `starting_proficiencies` (backgrounds).

## Alcance

### Qué SÍ implementar:
- Selección de skill proficiencies de clase (choose N from list)
- Proficiencias fijas de background (auto-asignadas)
- Expertise para Bardo (nivel 3+) y Pícaro (nivel 1+)
- Tabla visual de las 18 habilidades con modifiers calculados
- Guardar en `choices` y pasar al `CharacterSnapshot`

### Qué NO implementar:
- Proficiencias de raza (no están como skills directos en el SRD, van por traits)
- Proficiencias de armadura/armas/herramientas (no afectan skill checks)
- Saving throw proficiencies (feature separada)

## Archivos a modificar

### 1. `apps/frontend/src/pages/CreateCharacter.tsx`
**Estado nuevo:**
```typescript
const [selectedSkillProfs, setSelectedSkillProfs] = useState<string[]>([]);
const [expertiseSkills, setExpertiseSkills] = useState<string[]>([]);
```

**Datos derivados del asset de clase:**
- Extraer `proficiency_choices` del `selectedClass?.data` cuando cambie la clase
- Filtrar solo las que son `type: "proficiencies"` y opciones con `index` que empiece con `skill-`
- Obtener `choose: N` (cuántas puede elegir)
- Obtener la lista de skills disponibles

**Datos derivados del background:**
- Ya se extraen en `bgSkillProfs` (línea 349-354)
- Convertir a array y agregarlas automáticamente

**useEffect cuando cambia clase o background:**
- Reset `selectedSkillProfs` al cambiar de clase
- Auto-agregar proficiencias del background

**Nueva sección UI "Competencias de Habilidad":**
- Ubicación: entre la sección "Atributos" y "Trasfondo" (o después de Trasfondo)
- Grid de las 18 habilidades mostrando:
  - Nombre de la habilidad (español)
  - Ability score asociado (abreviatura)
  - Modifier total (ability mod + prof bonus si aplica)
  - Toggle/checkbox para marcar proficiency
  - Las de background marcadas y deshabilitadas (fijas)
  - Las de clase seleccionables hasta el límite
  - Contador: "X de Y seleccionadas"

**Features de clase que afectan skills (datos reales del SRD):**

| Clase | Nivel | Feature | Efecto |
|-------|-------|---------|--------|
| Bardo | 2 | Jack of All Trades | +½ prof bonus a checks sin proficiency |
| Bardo | 3 | Bonus Proficiencies (College of Lore) | +3 skills proficiency adicionales |
| Bardo | 3 | Expertise | 2 skills con prof bonus ×2 |
| Bardo | 10 | Expertise | 2 skills más con prof bonus ×2 |
| Pícaro | 1 | Expertise | 2 skills con prof bonus ×2 |
| Pícaro | 6 | Expertise | 2 skills más con prof bonus ×2 |
| Pícaro | 11 | Reliable Talent | Mínimo 10 en d20 con proficiency |
| Fighter | 7 | Remarkable Athlete (Champion) | +½ prof a STR/DEX/CON checks sin prof |
| Ranger | 1+ | Natural Explorer | Prof bonus ×2 en INT/WIS checks en terreno favorito |
| Warlock | 2 | Beguiling Influence (invocation) | Gana Deception + Persuasion |

**Subclases del SRD y nivel de elección:**

| Clase | Subclase SRD | Nivel de elección |
|-------|-------------|-------------------|
| Cleric | Life | 1 |
| Sorcerer | Draconic | 1 |
| Warlock | Fiend | 1 |
| Druid | Land | 2 |
| Wizard | Evocation | 2 |
| Barbarian | Berserker | 3 |
| Bard | Lore | 3 |
| Fighter | Champion | 3 |
| Monk | Open Hand | 3 |
| Paladin | Devotion | 3 |
| Ranger | Hunter | 3 |
| Rogue | Thief | 3 |

De estas, solo **Bard/Lore** otorga skills adicionales (+3 a nivel 3).

**Problema actual:** La selección de subclase en CreateCharacter.tsx se muestra siempre
si hay datos, sin filtrar por nivel. Dice "opcional" cuando debería ser obligatoria al
nivel correcto. La subclase elegida no afecta mecánicas (proficiencies, features).

**Fix necesario en CreateCharacter.tsx:**
- Guardar en el JSON del SRD o derivar el nivel mínimo de subclase por clase
- Solo mostrar selector de subclase si `level >= subclassLevel`
- Marcar como obligatoria cuando el nivel lo requiere
- Usar subclase seleccionada para determinar features adicionales (ej: Lore → +3 skills)

**Lo que se implementa en creación de personaje:**
- Expertise: Bardo (nivel 3+) y Pícaro (nivel 1+) — datos en `expertise_options` del SRD
- Bonus Proficiencies: Bardo College of Lore (nivel 3+) — +3 skills a elegir
- Beguiling Influence: Warlock (nivel 2+) — +Deception, +Persuasion automáticos
- Jack of All Trades: flag en Bardo (nivel 2+) — afecta el cálculo de tiradas
- Reliable Talent: flag en Pícaro (nivel 11+) — d20 mínimo 10
- Subclase seleccionada afecta disponibilidad de features (ej: solo Lore da Bonus Proficiencies)

**Lo que NO se implementa (condicional/contextual):**
- Remarkable Athlete (solo STR/DEX/CON, solo subclase Champion)
- Natural Explorer (depende del terreno actual, no del personaje)

**Guardar en choices:**
```typescript
{
  ...choices,
  skillProficiencies: [...backgroundProfs, ...selectedClassProfs],  // string[] con index SRD
  expertiseSkills: [...expertiseSelections],  // string[] con index SRD
  jackOfAllTrades: boolean,   // Bardo nivel 2+
  reliableTalent: boolean,    // Pícaro nivel 11+
}
```

### 2. `apps/frontend/src/lib/diceRoll.ts`
- Agregar expertise al cálculo: si skill está en `expertiseSkills`, proficiency bonus × 2
- Actualizar `RollResult` para incluir `isExpertise: boolean`
- Actualizar `formatRollResult` para mostrar "×2 prof" cuando hay expertise

### 3. `apps/backend/src/dm-session/domain/entities/dm-session.entity.ts`
- Agregar `expertiseSkills?: string[]` a `CharacterSnapshot`

### 4. `apps/frontend/src/lib/dmSessionApi.ts`
- Agregar `expertiseSkills?: string[]` a `CharacterSnapshot`

### 5. `apps/frontend/src/components/features/dm-session/SessionInitModal.tsx`
- Agregar `expertiseSkills` a `charToSnapshot()`

### 6. `apps/backend/src/dm-session/infrastructure/utils/dice-roll.ts`
- Agregar expertise al cálculo de `autoRollSkillCheck`

### 7. `apps/frontend/src/pages/DmSession.tsx` — CharacterStatsBar
- Mostrar proficiencias y expertise en el panel colapsable de stats

## Mapeo de Skills (constante compartida)

Las 18 habilidades D&D 5e con su ability y nombres EN/ES. Usar la lista que ya existe en `diceRoll.ts` extendida con el nombre en inglés para matchear con los datos SRD.

| Index SRD | Nombre EN | Nombre ES | Ability |
|-----------|-----------|-----------|---------|
| skill-athletics | Athletics | Atletismo | STR |
| skill-acrobatics | Acrobatics | Acrobacia | DEX |
| skill-sleight-of-hand | Sleight of Hand | Juego de manos | DEX |
| skill-stealth | Stealth | Sigilo | DEX |
| skill-arcana | Arcana | Arcanos | INT |
| skill-history | History | Historia | INT |
| skill-investigation | Investigation | Investigación | INT |
| skill-nature | Nature | Naturaleza | INT |
| skill-religion | Religion | Religión | INT |
| skill-animal-handling | Animal Handling | Trato con animales | WIS |
| skill-insight | Insight | Perspicacia | WIS |
| skill-medicine | Medicine | Medicina | WIS |
| skill-perception | Perception | Percepción | WIS |
| skill-survival | Survival | Supervivencia | WIS |
| skill-deception | Deception | Engaño | CHA |
| skill-intimidation | Intimidation | Intimidación | CHA |
| skill-performance | Performance | Interpretación | CHA |
| skill-persuasion | Persuasion | Persuasión | CHA |

## UI de la sección de habilidades

```
┌─ Competencias de Habilidad ──────────────────────┐
│ Clase: Bárbaro — Elige 2 de 6 disponibles        │
│ Background: Acólito — Insight, Religion (fijas)    │
│                                                    │
│ ┌──────────────────┬─────┬─────┬────────┐         │
│ │ Habilidad        │ Attr│ Mod │ Prof?  │         │
│ ├──────────────────┼─────┼─────┼────────┤         │
│ │ Atletismo        │ FUE │ +2  │ [✓]    │ ← clase │
│ │ Acrobacia        │ DES │ +1  │ [ ]    │         │
│ │ ...              │     │     │        │         │
│ │ Perspicacia      │ SAB │ +0  │ [✓]🔒  │ ← bg   │
│ │ Religión         │ INT │ -1  │ [✓]🔒  │ ← bg   │
│ └──────────────────┴─────┴─────┴────────┘         │
│                                                    │
│ [Expertise - solo Bardo/Pícaro]                   │
│ Elige 2 skills con proficiency para duplicar:     │
│ ○ Atletismo  ○ Perspicacia                        │
└──────────────────────────────────────────────────┘
```

## Conexión con DM IA y Auto-Player

### CharacterSnapshot ampliado
```typescript
interface CharacterSnapshot {
  // ... campos existentes ...
  stats?: AbilityScores;
  skillProficiencies?: string[];    // skills con proficiency (index SRD)
  expertiseSkills?: string[];       // skills con expertise / prof ×2 (index SRD)
  jackOfAllTrades?: boolean;        // Bardo nivel 2+: +½ prof a checks sin prof
  reliableTalent?: boolean;         // Pícaro nivel 11+: d20 mínimo 10
  subclass?: string;                // nombre de la subclase elegida
}
```

### DM IA (monolithic.py)
- `_format_character()` ya recibe el CharacterSnapshot completo
- Agregar las proficiencies y subclase al prompt del DM para que sepa qué puede hacer el personaje
- Ejemplo en el system prompt: "Jhon Travolta (Dragonborn Barbarian Lv3, Berserker). Proficiente en: Athletics, Perception. Expertise: ninguna."
- El DM puede pedir tiradas más relevantes sabiendo las fortalezas del personaje
- Archivo: `apps/dm-orchestrator/src/modes/monolithic.py` → `_format_character()`

### Auto-Player (groq-auto-player.adapter.ts)
- El system prompt ya incluye datos del personaje
- Agregar proficiencies al contexto para que el auto-player sepa qué es bueno haciendo
- Agregar al prompt: "Eres competente en: Athletics, Perception (+4 cada una). Expertise en: ninguna."
- Así elige acciones coherentes con sus fortalezas (un personaje proficiente en Stealth intentará sigilo)
- Archivo: `apps/backend/src/dm-session/infrastructure/adapters/groq-auto-player.adapter.ts` → `buildMessages()`

### Tiradas de dados (frontend + backend)
- `diceRoll.ts` y `dice-roll.ts` ya tienen la lógica de proficiency
- Agregar: `jackOfAllTrades` → +½ prof bonus redondeado abajo a checks sin proficiency
- Agregar: `reliableTalent` → si d20 < 10, tratar como 10 (solo con proficiency)
- Agregar: `expertiseSkills` → prof bonus ×2 en vez de ×1
- Todos estos datos vienen del CharacterSnapshot que se carga con la sesión

### Python schemas (dm-orchestrator)
- Actualizar `CharacterSnapshot` en `schemas.py` con los campos nuevos
- Actualizar `_format_character()` en `monolithic.py` para incluir proficiencies en el prompt

## Verificación

1. Crear personaje Bárbaro: debe mostrar 6 skills disponibles, elegir 2
2. Crear personaje Bardo nivel 3+: debe mostrar 18 skills, elegir 3, luego elegir 2 expertise
3. Crear personaje Pícaro nivel 1+: debe mostrar 11 skills, elegir 4, luego elegir 2 expertise
4. Background Acólito: Insight y Religion auto-marcadas y bloqueadas
5. Iniciar sesión DM: verificar que CharacterSnapshot incluye proficiencies y expertise
6. Tirada de dados: verificar que proficiency bonus se suma (+2 a nivel 1) y expertise duplica (+4)
7. Modo libre: muestra las 18 skills como checkboxes sin límite (el usuario marca las que quiera libremente)
