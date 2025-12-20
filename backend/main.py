from fastapi import FastAPI
from sqlmodel import SQLModel
from database import engine
from routers import users, activities, todos, auth

app = FastAPI()


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(activities.router)
app.include_router(todos.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}

