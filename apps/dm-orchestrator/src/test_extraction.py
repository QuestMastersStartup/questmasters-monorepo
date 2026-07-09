from src.extraction import _parse_json


def test_caso_valido_json_bien_formado_se_parsea_tal_cual():
    raw = (
        '{"events": [{"description": "El grupo entra a la cripta", '
        '"participants": ["Kaelen"], "outcome": "éxito"}], "entities": []}'
    )

    result = _parse_json(raw)

    assert result == {
        "events": [
            {
                "description": "El grupo entra a la cripta",
                "participants": ["Kaelen"],
                "outcome": "éxito",
            }
        ],
        "entities": [],
    }


def test_caso_limite_extrae_el_json_aunque_este_rodeado_de_texto():
    raw = (
        "Aquí está el análisis del turno:\n"
        '{"events": [], "entities": [{"id": "goblin-1", "type": "npc", '
        '"name": "Goblin", "relations": []}]}\n'
        "Fin del análisis."
    )

    result = _parse_json(raw)

    assert result == {
        "events": [],
        "entities": [{"id": "goblin-1", "type": "npc", "name": "Goblin", "relations": []}],
    }


def test_caso_invalido_json_roto_no_lanza_y_cae_al_default_vacio():
    # Hay un '{' y un '}' (el segundo es una llave suelta dentro de un string,
    # no un cierre real), así que se intenta el recorte pero json.loads falla.
    raw = '{"events": [{"description": "cita sin cerrar}], "entities": ['

    result = _parse_json(raw)

    assert result == {"events": [], "entities": []}


def test_caso_invalido_texto_sin_llaves_cae_al_default_vacio():
    raw = "el modelo no devolvió JSON en absoluto"

    result = _parse_json(raw)

    assert result == {"events": [], "entities": []}
