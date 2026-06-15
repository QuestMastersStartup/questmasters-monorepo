FROM runpod/base:0.6.1-cuda12.1.0

WORKDIR /app

COPY apps/dm-orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/dm-orchestrator/ .

ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/runpod-volume/shared/hf_cache

CMD ["python3", "-u", "handler.py"]
