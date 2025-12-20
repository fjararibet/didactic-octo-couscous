# Sistema de Gestión de Actividades

Sistema de gestión de actividades para prevencionistas y supervisores.

## Requisitos Previos

- Python 3.11+
- Node.js 18+
- PostgreSQL

## Instalación

### 1. Instalar uv (gestor de paquetes Python)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Backend (FastAPI)

```bash
cd backend

# Instalar dependencias
uv sync

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos

# Ejecutar migraciones
uv run alembic upgrade head

# Poblar base de datos con datos de prueba
uv run python populate_db.py

# Iniciar servidor de desarrollo
uv run uvicorn main:app --reload
```

El backend estará disponible en `http://localhost:8000`

### 3. Frontend (React + Vite)

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL del backend

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Scripts Útiles

### Backend

```bash
# Crear nueva migración
uv run alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
uv run alembic upgrade head

# Linting y type checking
uv run pre-commit run --all-files
```

### Frontend

```bash
# Linting y type checking
npm run check

# Build para producción
npm run build
```

## Usuarios de Prueba

Después de ejecutar `populate_db.py`:

- **Prevencionista**: `preventionist@example.com` / `password123`
- **Supervisor**: `supervisor1@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

## Estructura del Proyecto

```
.
├── backend/          # FastAPI application
│   ├── alembic/     # Database migrations
│   ├── models.py    # SQLAlchemy models
│   └── main.py      # App entry point
└── frontend/         # React + Vite application
    ├── src/
    └── package.json
```

## Tecnologías

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Herramientas**: uv, ESLint, Ruff

## Development Setup

### Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com/)

To install pre-commit:

1. Ensure you have `pipx` installed.
2. Install `pre-commit` using `pipx`:
   ```bash
   pipx install pre-commit
   ```
3. Install the git hooks for this repository:
   ```bash
   pre-commit install
   ```

Now, `pre-commit` will automatically run checks before each commit.
