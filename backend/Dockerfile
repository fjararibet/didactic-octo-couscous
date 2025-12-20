FROM python:3.13-slim-bookworm

# Locale
RUN apt-get update && apt-get install -y --no-install-recommends locales \
 && echo "es_CL.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen \
 && update-locale LANG=es_CL.UTF-8 \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.7.2 /uv /uvx /bin/

# App
WORKDIR /app
COPY . .

# Install deps
RUN uv sync --locked

# Activate venv
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]
