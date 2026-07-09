import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from importlib import import_module

coherence_score_module = import_module("coherence-score")
coherence_score = coherence_score_module.coherence_score
pairwise_overlaps = coherence_score_module.pairwise_overlaps
SentenceRecord = coherence_score_module.SentenceRecord


def test_coherence_score_matches_eq3_by_hand():
    # S1={a,b} S2={b,c} S3={c,d} -> overlaps [1,1] -> Coh = 1.0
    sets = [frozenset({"a", "b"}), frozenset({"b", "c"}), frozenset({"c", "d"})]
    assert coherence_score(sets) == 1.0


def test_coherence_score_zero_when_no_shared_entities():
    sets = [frozenset({"a"}), frozenset({"b"}), frozenset({"c"})]
    assert coherence_score(sets) == 0.0


def test_coherence_score_none_below_two_sentences():
    assert coherence_score([]) is None
    assert coherence_score([frozenset({"a"})]) is None


def test_pairwise_overlaps_reports_each_term_of_the_sum():
    records = [
        SentenceRecord("t1", 0, "Silas mira a Kora.", frozenset({"Silas", "Kora"})),
        SentenceRecord("t2", 0, "Kora responde a Silas.", frozenset({"Kora", "Silas"})),
        SentenceRecord("t3", 0, "Thorne llega.", frozenset({"Thorne"})),
    ]
    rows = pairwise_overlaps(records)
    assert [r["overlap_count"] for r in rows] == [2, 0]
    assert rows[0]["entidades_compartidas"] == "Kora|Silas"
    assert rows[1]["entidades_compartidas"] == ""
