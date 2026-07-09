"""Stubs de dependencias pesadas (torch/transformers/peft/chromadb) que solo
existen en el entorno RunPod. Las funciones bajo prueba no ejercitan su
comportamiento real (solo aparecen en anotaciones de tipo, evaluadas de forma
perezosa por `from __future__ import annotations`), así que un stub vacío
basta para que los módulos se puedan importar en local."""

import sys
import types


def _stub(name: str, *attrs: str) -> None:
    if name in sys.modules:
        return
    module = types.ModuleType(name)
    for attr in attrs:
        setattr(module, attr, type(attr, (), {}))
    sys.modules[name] = module


_stub("peft", "PeftModel")
_stub("transformers", "PreTrainedTokenizerBase")
_stub("chromadb", "PersistentClient", "Collection")
