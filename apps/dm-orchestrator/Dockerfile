FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /app

COPY apps/dm-orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/dm-orchestrator/ .

ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/runpod-volume/shared/hf_cache

CMD ["python3", "-u", "handler.py"]
