# syntax=docker/dockerfile:1.7
FROM python:3.11

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY python-backend-chat/requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install --retries 5 --default-timeout 120 -r /app/requirements.txt

COPY python-backend-chat/professor_clone.py /app/professor_clone.py
RUN mkdir -p /app/docs

# DB lives on a named volume at runtime; ensure path exists
RUN mkdir -p /app/professor_db

WORKDIR /app
EXPOSE 8000

CMD ["python", "professor_clone.py"]
