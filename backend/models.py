from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum
from sqlalchemy import Column, Enum as SAEnum


class Role(str, Enum):
    preventionist = "preventionist"
    supervisor = "supervisor"
    admin = "admin"




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

    supervisors_assigned: List["SupervisorAssignment"] = Relationship(
        back_populates="preventionist",
        sa_relationship_kwargs={"foreign_keys": "[SupervisorAssignment.preventionist_id]"},
    )
    preventionist_assigned: Optional["SupervisorAssignment"] = Relationship(
        back_populates="supervisor",
        sa_relationship_kwargs={
            "foreign_keys": "[SupervisorAssignment.supervisor_id]"
        },
    )


class SupervisorAssignment(SQLModel, table=True):
    preventionist_id: int = Field(foreign_key="user.id", primary_key=True)
    supervisor_id: int = Field(foreign_key="user.id", primary_key=True)

    preventionist: "User" = Relationship(
        back_populates="supervisors_assigned",
        sa_relationship_kwargs={"foreign_keys": "[SupervisorAssignment.preventionist_id]"},
    )
    supervisor: "User" = Relationship(
        back_populates="preventionist_assigned",
        sa_relationship_kwargs={
            "foreign_keys": "[SupervisorAssignment.supervisor_id]"
        },
    )


class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    scheduled_date: Optional[datetime] = None
    finished_date: Optional[datetime] = None
    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_by: Optional[User] = Relationship(
        back_populates="activities_created",
        sa_relationship_kwargs={"foreign_keys": "[Activity.created_by_id]"},
    )

    assigned_to_id: int = Field(foreign_key="user.id")
    assigned_to: "User" = Relationship(
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


class ActivityTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None

    template_todos: List["TemplateTodoItem"] = Relationship(back_populates="template")


class TemplateTodoItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str

    template_id: Optional[int] = Field(default=None, foreign_key="activitytemplate.id")
    template: Optional[ActivityTemplate] = Relationship(back_populates="template_todos")
