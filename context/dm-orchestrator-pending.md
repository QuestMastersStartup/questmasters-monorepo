# DM Orchestrator — Pendientes

## ~~Scripts de inicialización del volumen~~ ✅

Completado 2026-06-15:
- `scripts/download_base_model.py` creado (ya no es necesario correrlo manualmente)
- El modelo `google/gemma-4-26B-A4B-it` se descarga automáticamente vía HuggingFace cache al Network Volume (`HF_HOME=/runpod-volume/shared/hf_cache`) en el primer cold start
- `scripts/index_srd.py` sigue pendiente (ver abajo)

---

## Scripts de inicialización del volumen — pendiente parcial

### `scripts/index_srd.py`
Indexa el SRD 5.1 en L4 (ChromaDB read-only compartido):
- Leer el PDF/texto del SRD 5.1
- Dividir en chunks
- Insertar en ChromaDB en `/runpod-volume/shared/l4_srd_chroma`
- Solo se corre una vez; el resultado es compartido entre sesiones

---

## LightRAG — embedding function

`src/modes/monolithic.py` crea `LightRAG` sin embedding function:
```python
LightRAG(working_dir=..., llm_model_func=_llm_func)
```
LightRAG necesita también una `embedding_func` para vectorizar el grafo. Opciones:
- Usar el propio Gemma con un adaptador de embeddings
- Usar `sentence-transformers` con un modelo ligero (ej. `all-MiniLM-L6-v2`)

Decidir cuál y añadirla en `_get_lightrag()`.

---

## Usage stats reales

Todos los chunks `MetadataChunk` devuelven `prompt_tokens=0, completion_tokens=0`.

Contar tokens reales en `mas.py` y `monolithic.py` usando el tokenizer:
```python
prompt_tokens = len(tokenizer.encode(prompt))
completion_tokens = len(tokenizer.encode(full_response))
```

---

## ~~GitHub Actions — build y push de imagen~~ ✅

RunPod está conectado directamente al repo de GitHub y hace el rebuild automáticamente en cada push a `main`. No se necesita workflow adicional.

CI general (`.github/workflows/ci.yml`) simplificado 2026-06-15: solo typecheck para api/client y test+build para dnd-rules.

---

## ~~Wrangler — vars de entorno~~ ✅

Completado 2026-06-15:
- `DM_USE_RUNPOD`, `RUNPOD_ENDPOINT_ID`, `RUNPOD_API_KEY` añadidos a `bindings.ts`, `wrangler.toml` y `.dev.vars`
- `.dev.vars.example` creado como plantilla versionable

---

## ~~CLAUDE.md desactualizado~~ ✅

Completado 2026-06-15:
- Backend actualizado de Elysia → Hono en `CLAUDE.md`
- dm-orchestrator añadido al stack

---

## ~~Configuración manual en RunPod~~ ✅

Completado 2026-06-15:
- Endpoint ID: `g8r9eva5md9z4a`
- Build: desde `QuestMastersStartup/questmasters-monorepo` rama `main`, Dockerfile en `apps/dm-orchestrator/Dockerfile`
- GPU: 48 GB
- Max workers: 1
- `HF_TOKEN` configurado como Secret en el endpoint
- Network Volume `questmasters-models` (80 GB) adjunto en `/runpod-volume`
- Fixes aplicados: imagen base CUDA 12.1, rutas COPY para monorepo, `python3` en CMD

---

## Tests

No hay ningún test en `apps/dm-orchestrator/`. Mínimo útil:
- `src/memory/l2_episodic.test.py` — save + retrieve con SQLite/Chroma en tmp
- `src/memory/l3_semantic.test.py` — upsert + query de grafo
- `src/extraction.test.py` — parse de JSON con casos edge (JSON malformado, vacío)
- `handler.test.py` — con `runpod.serverless.test_handler` y modelo mockeado
