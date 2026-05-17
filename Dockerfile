# Stage 1: Build frontend bundle
FROM node:26-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json esbuild.config.json ./
RUN npm ci
COPY frontend/ ./frontend/
RUN npm run build-only

# Stage 2: App source — shared between builder and runtime; local_settings.py
# is excluded via .dockerignore so it is never baked in here. The runtime
# entrypoint generates it from the template at container start.
FROM python:3.13-slim AS app-source
WORKDIR /code
COPY manage.py setup-db.sh ./
COPY smm/ ./smm/
COPY assets/ ./assets/
COPY data/ ./data/
COPY docker/ ./docker/
COPY icons/ ./icons/
COPY images/ ./images/
COPY map/ ./map/
COPY marinesar/ ./marinesar/
COPY mission/ ./mission/
COPY organization/ ./organization/
COPY search/ ./search/
COPY timeline/ ./timeline/

# Stage 3: Build Python venv and collect static files
FROM python:3.13-slim AS python-builder
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libgdal-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /code
COPY requirements.txt ./
RUN python3 -m venv /code/venv && \
    /code/venv/bin/pip install --no-cache-dir wheel && \
    /code/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY --from=app-source /code/ ./
COPY --from=frontend /app/dist/ ./map/static/
RUN cp smm/local_settings.py.template smm/local_settings.py && \
    python3 -c 'import secrets; print(secrets.token_urlsafe(50))' > smm/secretkey.txt && \
    /code/venv/bin/python manage.py collectstatic --no-input && \
    rm smm/secretkey.txt smm/local_settings.py && \
    mkdir -p images/full images/thumbnail

# Stage 4: Runtime image
FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libgdal36 && rm -rf /var/lib/apt/lists/*
WORKDIR /code
COPY --from=python-builder /code/venv ./venv/
COPY --from=python-builder /code/static ./static/
COPY --from=app-source /code/ ./
RUN mkdir -p images/full images/thumbnail

ENTRYPOINT ["/code/docker/app/start.sh"]
