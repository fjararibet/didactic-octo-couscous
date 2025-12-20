# Setup Backend Virtual Environment
```
cd backend
uv sync
source ./venv/bin/activate
```

# Database migrations

To create a new migration:
```
alembic revision --autogenerate -m "description of changes"
```
To apply the migration to the db:
```
alembic upgrade head
```
