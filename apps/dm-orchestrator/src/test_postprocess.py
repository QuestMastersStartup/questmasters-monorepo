from src.postprocess import (
    is_meta_response,
    _truncate_to_last_sentence,
    clean_narrator_response,
    clean_agent_response,
)


def test_caso_valido_frase_meta_es_detectada():
    assert is_meta_response("Estoy listo para continuar la aventura cuando quieras.") is True


def test_caso_invalido_narracion_normal_no_es_meta():
    assert is_meta_response("El goblin ataca con su daga oxidada.") is False


def test_caso_valido_texto_corto_no_se_trunca():
    text = "El pasillo está en silencio."
    assert _truncate_to_last_sentence(text, max_words=200) == text


def test_caso_limite_corta_en_la_ultima_oracion_completa():
    text = (
        "Avanzas por el pasillo. El aire es frío y húmedo. "
        "Escuchas un ruido extraño proveniente de la oscuridad más profunda."
    )
    result = _truncate_to_last_sentence(text, max_words=15)

    assert result == "Avanzas por el pasillo. El aire es frío y húmedo."
    assert "Escuchas" not in result


def test_caso_valido_preserva_tirada_de_dado_aunque_exceda_el_limite():
    text = (
        "El pasillo se extiende ante ti en la oscuridad total. "
        "Haz una tirada de Percepción (CD 15) para notar la trampa oculta en el suelo de piedra."
    )
    result = _truncate_to_last_sentence(text, max_words=10)

    # El corte por conteo de palabras caería a mitad de la tirada; la función
    # debe preservarla completa en vez de cortarla a la mitad.
    assert "Haz una tirada de Percepción (CD 15)" in result
    assert result.endswith(".")


def test_caso_invalido_sin_puntuacion_trunca_y_agrega_punto_final():
    text = "uno dos tres cuatro cinco seis siete ocho nueve diez"
    result = _truncate_to_last_sentence(text, max_words=4)

    assert result == "uno dos tres cuatro."


def test_caso_valido_clean_agent_response_remueve_encabezado():
    text = "**Soy el Agente de Reglas.**\nEl ataque impacta con fuerza."
    result = clean_agent_response(text)

    assert result == "El ataque impacta con fuerza."


def test_caso_valido_clean_narrator_response_remueve_encabezado_y_mecanica_de_combate():
    text = (
        "**Soy el Agente Narrador.**\n"
        "El goblin se prepara. Haz una tirada de Ataque cuerpo a cuerpo contra él. "
        "El golpe no conecta."
    )
    result = clean_narrator_response(text)

    assert "Agente Narrador" not in result
    assert "tirada de Ataque" not in result
    assert "El golpe no conecta" in result
