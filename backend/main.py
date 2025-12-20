from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from database import engine
from routers import users, activities, todos, auth, activity_templates, todos_template


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],  # Vite and React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth")
app.include_router(users.router, prefix="/users")
app.include_router(activities.router, prefix="/activities")
app.include_router(todos.router, prefix="/todos")
app.include_router(activity_templates.router, prefix="/activity-templates")
app.include_router(todos_template.router, prefix="/todos-template")


@app.get("/")
def read_root():
    return {"Hello": "World"}

