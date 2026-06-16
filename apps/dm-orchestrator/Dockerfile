FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /app

COPY apps/dm-orchestrator/requirements.txt .
# Upgrade PyTorch to 2.6+ for Blackwell (sm_120); pin torchvision to matching version
RUN pip install --no-cache-dir "torch==2.6.0" "torchvision==0.21.0" --index-url https://download.pytorch.org/whl/cu124 && \
    pip install --no-cache-dir -r requirements.txt

COPY apps/dm-orchestrator/ .

ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/runpod-volume/shared/hf_cache

CMD ["python3", "-u", "handler.py"]
