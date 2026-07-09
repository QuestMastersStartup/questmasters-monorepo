#!/usr/bin/env python
"""
Coherencia local por entidades compartidas sobre la narración del DM (`dm_turns.dm_response`),
ya persistida en D1. Método publicado, no inventado — ver contexto/deterministic-instruments
(skill) y ~/.claude/skills/deterministic-instruments/SKILL.md.

Fuente: Shen, Q. et al. (2026), "Children's English Reading Story Generation via Supervised
Fine-Tuning of Compact LLMs with Controllable Difficulty and Safety", arXiv:2605.13709v1,
Sección 3.3 ("we introduced a coherence score to quantify local narrative consistency by
averaging the number of shared named entities between consecutive sentences, identified using
spaCy") y Apéndice A, ecuación 3:

    Coh = 1/(N-1) * sum_{i=1}^{N-1} |E(S_i) ∩ E(S_i+1)|

donde E(S_i) es el conjunto de entidades nombradas de la oración i-ésima y N el total de
oraciones. El paper calcula un único Coh por historia completa (una secuencia continua de
oraciones) — aquí la "historia" es la campaña completa: los `dm_response` de todos los turnos,
en orden de `turn_number`, tratados como una sola narración continua, exactamente como en el
paper.

Adaptación explícita (no en el paper original, documentada para no ocultarla):
- El paper usa spaCy en inglés (cuentos infantiles). Aquí la narración es en español, así que
  se usa `es_core_news_md` — mismo método (spaCy NER), modelo de idioma distinto. Se probó
  primero `es_core_news_sm`, pero en una muestra de la propia transcripción tageaba cláusulas
  completas como una sola entidad MISC ("Se llama Silas" entero, sin aislar "Silas") en 7/7
  oraciones de prueba y nunca reconoció un nombre de personaje como PER — inutilizable en este
  dominio (narrativa de fantasía en 2ª persona, muy distinto al corpus de noticias/Wikipedia con
  el que se entrena `es_core_news_*`). `md` mejora de forma medible en la misma muestra (aísla
  "Silas" como PER, no alucina en 2/7 oraciones donde `sm` sí) — sigue sin ser perfecto, pero es
  la opción menos mala sin salir de spaCy. Ver `context/NER_Coherencia_Shen2026.md` para la
  comparación completa.
- `E(S_i)` se construye con el texto exacto (`ent.text`) de cada entidad detectada por spaCy,
  sin normalizar mayúsculas/minúsculas ni filtrar por tipo de entidad (PER/LOC/MISC/ORG) — el
  paper no especifica ninguna de las dos cosas, así que no se agrega ninguna.
- Las oraciones se segmentan turno por turno (spaCy corre sobre cada `dm_response`
  individualmente) y después se concatenan en orden — evita que el final de un turno se fusione
  con el inicio del siguiente si a alguno le falta puntuación de cierre.
- Se normalizan espacios en blanco (`" ".join(texto.split())`) antes de pasar cada `dmResponse`
  a spaCy. Necesario porque el `turnos.json` reconstruido desde el PDF de respaldo trae saltos
  de línea embebidos a mitad de oración (artefacto del wrap de línea de `pdftotext -layout`,
  no del texto real) que rompen el segmentador de oraciones de spaCy si no se limpian primero.
  Un `dm_response` real de D1 ya viene como una sola cadena continua, así que esta normalización
  no cambia nada sobre datos de producción reales — solo neutraliza el artefacto del PDF.

Uso: python scripts/coherence-score.py <turnos.json> [salida.csv]

Formato de <turnos.json>: array de objetos con al menos `turnId` y `dmResponse` (incluye a
propósito el mismo array que ya usan mechanics-score.ts / distinct-ngrams.ts — los campos
extra que no se usan aquí, como `nextPlayerInput` o `character`, se ignoran).
"""
from __future__ import annotations

import csv
import json
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class SentenceRecord:
    turn_id: str
    sentence_index: int
    text: str
    entities: frozenset[str]


def extract_sentences_with_entities(turns: list[dict], nlp) -> list[SentenceRecord]:
    """Segmenta cada dm_response en oraciones (spaCy) y extrae E(S_i) por oración,
    preservando el orden de los turnos tal como vienen en la entrada."""
    records: list[SentenceRecord] = []
    for turn in turns:
        normalized_text = " ".join(turn["dmResponse"].split())
        doc = nlp(normalized_text)
        for idx, sent in enumerate(doc.sents):
            entities = frozenset(ent.text for ent in sent.ents)
            records.append(SentenceRecord(turn["turnId"], idx, sent.text.strip(), entities))
    return records


def coherence_score(entity_sets: list[frozenset[str]]) -> float | None:
    """Ecuación 3 de Shen et al. (2026): promedio de |E(S_i) ∩ E(S_i+1)| sobre oraciones
    consecutivas. Función pura, sin dependencia de spaCy — testeable de forma aislada."""
    n = len(entity_sets)
    if n < 2:
        return None
    overlaps = [len(entity_sets[i] & entity_sets[i + 1]) for i in range(n - 1)]
    return sum(overlaps) / len(overlaps)


def pairwise_overlaps(records: list[SentenceRecord]) -> list[dict]:
    """Detalle por par de oraciones consecutivas, para trazabilidad (equivalente a exponer
    cada término de la sumatoria de la ecuación 3, no una métrica nueva)."""
    rows = []
    for i in range(len(records) - 1):
        a, b = records[i], records[i + 1]
        shared = a.entities & b.entities
        rows.append(
            {
                "par_index": i,
                "turno_a": a.turn_id,
                "turno_b": b.turn_id,
                "entidades_a": "|".join(sorted(a.entities)),
                "entidades_b": "|".join(sorted(b.entities)),
                "entidades_compartidas": "|".join(sorted(shared)),
                "overlap_count": len(shared),
            }
        )
    return rows


def to_csv(rows: list[dict]) -> str:
    if not rows:
        return "par_index,turno_a,turno_b,entidades_a,entidades_b,entidades_compartidas,overlap_count"
    import io

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().strip()


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python scripts/coherence-score.py <turnos.json> [salida.csv]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    import spacy

    nlp = spacy.load("es_core_news_md")

    with open(input_path, "r", encoding="utf-8") as f:
        turns = json.load(f)

    records = extract_sentences_with_entities(turns, nlp)
    rows = pairwise_overlaps(records)
    coh = coherence_score([r.entities for r in records])

    csv_text = to_csv(rows)
    if output_path:
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            f.write(csv_text)
    else:
        print(csv_text)

    print(
        f"\nAgregado de campaña ({len(turns)} turnos, {len(records)} oraciones, "
        f"{len(rows)} pares consecutivos): Coh = {coh:.4f}" if coh is not None else
        "\nAgregado de campaña: Coh no aplica (menos de 2 oraciones)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
