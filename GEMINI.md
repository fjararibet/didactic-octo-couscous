# Backend
- The backend directory is a FastAPI project. 
- Astral's uv is being used as a project manager.
- Always use pydantic and type hinting when necessary. Never let there be magic values, use types from `typing` to solve that.
- Astral's ruff and ty are being used for linting and type checking. To run them both use `pre-commit run --all-files`.
