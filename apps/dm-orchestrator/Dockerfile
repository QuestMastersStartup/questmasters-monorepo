FROM runpod/base:0.6.1-cuda12.1.0

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/runpod-volume/shared/hf_cache

CMD ["python", "-u", "handler.py"]
