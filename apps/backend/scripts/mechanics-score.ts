#!/usr/bin/env bun
/**
 * Puntaje determinístico de "corrección de mecánicas de juego" para turnos de dm_sessions
 * ya persistidos en D1 (tabla `dm_turns`).
 *
 * No llama a Colab/RunPod ni depende del grafo L3 — solo usa `parseSkillCheck` (parsea el
 * chequeo que el DM declara en su narración) y `dnd-rules` (recalcula el resultado esperado
 * según la ficha del personaje) para verificar si la resolución auto-rolled (ver
 * `apps/backend/src/routes/dm-sessions.routes.ts` — endpoint `/auto-turn`, que guarda el
 * bracket `[Tirada de ...]` en el `player_input` del turno SIGUIENTE) es aritméticamente
 * consistente. Ver contexto/Auditoria_Instrumentos_Deterministicos.md.
 *
 * Uso: bun run scripts/mechanics-score.ts <turnos.json> [salida.csv]
 *
 * Formato de <turnos.json>: array de TurnInput (ver abajo). `nextPlayerInput` es el
 * `player_input` del turno con `turn_number + 1` de la misma `dm_sessions` — solo está
 * presente cuando ese turno vino del flujo auto-player (`/auto-turn`); en sesiones humanas
 * normalmente no habrá bracket y el turno queda como "sin_resolucion_verificable".
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseSkillCheck } from "../src/dm-session/infrastructure/utils/dice-roll";
import { calculateModifier, calculateProficiencyBonus } from "@questmasters/dnd-rules";
import type { AbilityScores } from "@questmasters/dnd-rules";

export interface CharacterSnapshotInput {
  stats: AbilityScores;
  level: number;
  skillProficiencies?: string[];
  expertiseSkills?: string[];
}

export interface TurnInput {
  turnId: string;
  dmResponse: string;
  nextPlayerInput?: string;
  character?: CharacterSnapshotInput;
}

export interface TurnScore {
  turnId: string;
  puntajeMecanicas: number | null;
  detalle: string;
}

const ROLL_BRACKET =
  /\[Tirada de [^:]+:\s*d20\((\d+)\)\s*([+-]\d+)(?:\s*\+(\d+)\s*(?:prof|expertise|JoAT))?(?:\s*\(Reliable\))?\s*=\s*(-?\d+)\s*vs CD (\d+)\s*—\s*(Éxito|Fallo)\]/;

export function scoreTurn(turn: TurnInput): TurnScore {
  const check = parseSkillCheck(turn.dmResponse);
  if (!check) {
    // El DM no declaró ningún chequeo/salvación este turno — instrumento no aplica.
    return { turnId: turn.turnId, puntajeMecanicas: null, detalle: "sin_chequeo" };
  }

  const match = turn.nextPlayerInput?.match(ROLL_BRACKET);
  if (!match) {
    // Chequeo bien formado (skill/ability + CD reconocidos por dnd-rules), pero sin
    // resolución auto-rolled disponible para verificar la aritmética (turno humano).
    return { turnId: turn.turnId, puntajeMecanicas: 1, detalle: "chequeo_reconocido_sin_resolucion" };
  }

  if (!turn.character?.stats) {
    return { turnId: turn.turnId, puntajeMecanicas: null, detalle: "resolucion_presente_sin_ficha_personaje" };
  }

  const [, d20Str, , , totalStr, dcStr, resultLabel] = match;
  const d20 = parseInt(d20Str, 10);
  const reportedTotal = parseInt(totalStr, 10);
  const dc = parseInt(dcStr, 10);

  const expectedMod = calculateModifier(turn.character.stats[check.ability]);
  const profBase = calculateProficiencyBonus(turn.character.level);
  const isProficient = (turn.character.skillProficiencies ?? []).some(
    (p) => p.toLowerCase() === check.skillName.toLowerCase(),
  );
  const isExpertise = (turn.character.expertiseSkills ?? []).some(
    (p) => p.toLowerCase() === check.skillName.toLowerCase(),
  );
  const expectedBonus = check.isSavingThrow
    ? 0
    : isExpertise
      ? profBase * 2
      : isProficient || check.alwaysProficient
        ? profBase
        : 0;
  const expectedTotal = d20 + expectedMod + expectedBonus;
  const expectedPass = expectedTotal >= dc;
  const reportedPass = resultLabel === "Éxito";

  if (expectedTotal === reportedTotal && expectedPass === reportedPass) {
    return { turnId: turn.turnId, puntajeMecanicas: 1, detalle: "resolucion_consistente" };
  }

  return {
    turnId: turn.turnId,
    puntajeMecanicas: 0,
    detalle: `inconsistente(total_esperado=${expectedTotal},total_reportado=${reportedTotal},` +
      `resultado_esperado=${expectedPass ? "Éxito" : "Fallo"},resultado_reportado=${resultLabel})`,
  };
}

export function toCsv(scores: TurnScore[]): string {
  const rows = scores.map(
    (s) => `${s.turnId},${s.puntajeMecanicas ?? ""},${JSON.stringify(s.detalle)}`,
  );
  return ["turno_id,puntaje_mecanicas,detalle", ...rows].join("\n");
}

if (import.meta.main) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error("Uso: bun run scripts/mechanics-score.ts <turnos.json> [salida.csv]");
    process.exit(1);
  }

  const turns: TurnInput[] = JSON.parse(readFileSync(inputPath, "utf-8"));
  const scores = turns.map(scoreTurn);
  const applicable = scores.filter((s) => s.puntajeMecanicas !== null);
  const aggregate =
    applicable.length > 0
      ? applicable.reduce((sum, s) => sum + (s.puntajeMecanicas ?? 0), 0) / applicable.length
      : NaN;

  const csv = toCsv(scores);
  if (outputPath) {
    writeFileSync(outputPath, csv);
  } else {
    console.log(csv);
  }
  console.error(
    `\nAgregado: ${applicable.length}/${scores.length} turnos con chequeo aplicable — ` +
      `puntaje_mecanicas promedio = ${aggregate.toFixed(3)}`,
  );
}
