#!/usr/bin/env bun
/**
 * Distinct-1 / Distinct-2 sobre el texto narrado (`dm_turns.dm_response`), ya persistido
 * en D1. Métrica de diversidad léxica pura — no depende de Colab, GPU ni del grafo L3.
 * Ver contexto/Auditoria_Instrumentos_Deterministicos.md.
 *
 * Nota: distinct-n por turno satura cerca de 1.0 en textos cortos (pocos tokens ⇒ pocas
 * repeticiones posibles) — el número por turno sirve para detectar outliers (bucles de
 * repetición dentro de un mismo turno), pero la comparación entre campañas/checkpoints del
 * modelo debe hacerse sobre el agregado a nivel de campaña (impreso en stderr).
 *
 * Uso: bun run scripts/distinct-ngrams.ts <turnos.json> [salida.csv]
 */
import { readFileSync, writeFileSync } from "node:fs";

export interface TurnInput {
  turnId: string;
  dmResponse: string;
}

export interface TurnDistinctScore {
  turnId: string;
  distinct1: number | null;
  distinct2: number | null;
}

export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function distinctN(tokens: string[], n: number): number | null {
  if (tokens.length < n) return null;
  const grams = new Set<string>();
  let total = 0;
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.add(tokens.slice(i, i + n).join(" "));
    total++;
  }
  return total === 0 ? null : grams.size / total;
}

export function scoreTurn(turn: TurnInput): TurnDistinctScore {
  const tokens = tokenize(turn.dmResponse);
  return {
    turnId: turn.turnId,
    distinct1: distinctN(tokens, 1),
    distinct2: distinctN(tokens, 2),
  };
}

export function toCsv(scores: TurnDistinctScore[]): string {
  const rows = scores.map((s) => `${s.turnId},${s.distinct1 ?? ""},${s.distinct2 ?? ""}`);
  return ["turno_id,distinct_1,distinct_2", ...rows].join("\n");
}

if (import.meta.main) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error("Uso: bun run scripts/distinct-ngrams.ts <turnos.json> [salida.csv]");
    process.exit(1);
  }

  const turns: TurnInput[] = JSON.parse(readFileSync(inputPath, "utf-8"));
  const scores = turns.map(scoreTurn);

  const csv = toCsv(scores);
  if (outputPath) {
    writeFileSync(outputPath, csv);
  } else {
    console.log(csv);
  }

  // Agregado a nivel de campaña: distinct-n sobre la concatenación de todos los turnos.
  const allTokens = turns.flatMap((t) => tokenize(t.dmResponse));
  const campaignDistinct1 = distinctN(allTokens, 1);
  const campaignDistinct2 = distinctN(allTokens, 2);
  console.error(
    `\nAgregado de campaña (${turns.length} turnos, ${allTokens.length} tokens): ` +
      `distinct-1 = ${campaignDistinct1?.toFixed(4)}, distinct-2 = ${campaignDistinct2?.toFixed(4)}`,
  );
}
