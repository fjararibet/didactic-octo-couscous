from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum
from sqlalchemy import Column, Enum as SAEnum


class Role(str, Enum):
    preventionist = "preventionist"
    supervisor = "supervisor"
    admin = "admin"


class Status(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    role: Role = Field(sa_column=Column(SAEnum(Role)))
    password_hash: str

    activities_created: List["Activity"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[Activity.created_by_id]"},
    )
    activities_assigned: List["Activity"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={"foreign_keys": "[Activity.assigned_to_id]"},
    )


class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    status: Status = Field(default=Status.pending, sa_column=Column(SAEnum(Status)))
    scheduled_date: Optional[datetime] = None
    finished_date: Optional[datetime] = None

    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_by: Optional[User] = Relationship(
        back_populates="activities_created",
        sa_relationship_kwargs={"foreign_keys": "[Activity.created_by_id]"},
    )

    assigned_to_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_to: Optional[User] = Relationship(
        back_populates="activities_assigned",
        sa_relationship_kwargs={"foreign_keys": "[Activity.assigned_to_id]"},
    )

    todos: List["TodoItem"] = Relationship(back_populates="activity")


class TodoItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    is_done: bool = Field(default=False)

    activity_id: Optional[int] = Field(default=None, foreign_key="activity.id")
    activity: Optional[Activity] = Relationship(back_populates="todos")
