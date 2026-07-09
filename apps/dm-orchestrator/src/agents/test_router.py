import pytest

from src.agents import router


def _blackboard(player_input: str, turn_count: int = 0) -> dict:
    return {
        "player_input": player_input,
        "campaign_prompt": "Una mazmorra olvidada",
        "conversation_history": [{"role": "player", "content": "x"}] * turn_count,
    }


def test_caso_valido_normalize_pasa_a_minusculas_y_quita_puntuacion():
    assert router._normalize("¡ATACO al Goblin!") == "ataco al goblin"


def test_caso_valido_fallback_route_detecta_intencion_de_combate_por_keyword():
    decision = router._fallback_route("Ataco al goblin con mi espada", turn_count=0)

    assert decision["needs_arbiter"] is True
    assert decision["needs_npc"] is False
    assert decision["needs_world"] is False


def test_caso_limite_fallback_route_activa_memoria_automatica_desde_turno_3():
    # Sin ninguna keyword de memoria, pero ya van 3+ turnos de historial.
    decision = router._fallback_route("Sigo caminando por el pasillo", turn_count=3)

    assert decision["needs_memory"] is True


def test_caso_valido_route_usa_la_decision_de_groq_cuando_esta_disponible(monkeypatch):
    monkeypatch.setattr(
        router,
        "groq_json",
        lambda **kwargs: {
            "needs_memory": False,
            "needs_arbiter": True,
            "needs_npc": False,
            "needs_world": False,
        },
    )

    decision = router.route(_blackboard("Ataco al goblin"))

    assert decision == {
        "needs_memory": False,
        "needs_arbiter": True,
        "needs_npc": False,
        "needs_world": False,
    }


def test_caso_invalido_route_cae_a_fallback_si_groq_lanza_excepcion(monkeypatch):
    def _boom(**kwargs):
        raise RuntimeError("groq no disponible")

    monkeypatch.setattr(router, "groq_json", _boom)

    # "hablo" está en _NPC_KW, así que el fallback por keywords debe activar needs_npc.
    decision = router.route(_blackboard("Le hablo al tabernero"))

    assert decision["needs_npc"] is True


def test_caso_valido_run_router_usa_decision_pre_computada_sin_llamar_a_groq(monkeypatch):
    called = False

    def _fail_if_called(**kwargs):
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr(router, "groq_json", _fail_if_called)

    result = router.run_router(
        _blackboard("cualquier cosa"),
        pre_computed={"needs_memory": True, "needs_arbiter": False, "needs_npc": False, "needs_world": False},
    )

    assert called is False
    assert result["route_decision"]["needs_memory"] is True
