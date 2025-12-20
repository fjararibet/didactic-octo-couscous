from __future__ import annotations
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel
from models import Role, Status

# Shared properties
class UserBase(SQLModel):
    username: str
    email: str
    role: Role = Role.preventionist

# Properties to receive on item creation
class UserCreate(UserBase):
    password: str

# Properties to receive on item update
class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[Role] = None
    password: Optional[str] = None

# Properties to return to client
class UserRead(UserBase):
    id: int
    username: str
    email: str


class SupervisorAssignmentCreate(SQLModel):
    supervisor_id: int
    preventionist_id: int


# Shared properties
class ActivityBase(SQLModel):
    name: str
    status: Status = Status.pending
    scheduled_date: Optional[datetime] = None
    finished_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

# Properties to receive on item creation
class ActivityCreate(ActivityBase):
    activity_template_id: Optional[int] = None

class ActivityUpdate(SQLModel):
    name: Optional[str] = None
    status: Optional[Status] = None
    scheduled_date: Optional[datetime] = None
    finished_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class ActivityRead(ActivityBase):
    id: int
    created_by: UserRead
    assigned_to: Optional[UserRead] = None
    todos: list["TodoItemRead"] = []


class TodoItemBase(SQLModel):
    description: str
    is_done: bool = False
    activity_id: int

class TodoItemCreate(TodoItemBase):
    pass

class TodoItemUpdate(SQLModel):
    description: Optional[str] = None
    is_done: Optional[bool] = None
    activity_id: Optional[int] = None

class TodoItemRead(TodoItemBase):
    id: int


class ActivityTemplateBase(SQLModel):
    name: str
    description: Optional[str] = None


class ActivityTemplateCreate(ActivityTemplateBase):
    pass


class ActivityTemplateUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ActivityTemplateRead(ActivityTemplateBase):
    id: int
    template_todos: list["TemplateTodoItemRead"] = []


class TemplateTodoItemBase(SQLModel):
    description: str


class TemplateTodoItemCreate(TemplateTodoItemBase):
    pass


class TemplateTodoItemCreateList(SQLModel):
    items: list[TemplateTodoItemCreate]


class TemplateTodoItemUpdate(SQLModel):
    description: Optional[str] = None


class TemplateTodoItemRead(TemplateTodoItemBase):
    id: int
    template_id: int


class Token(SQLModel):
    access_token: str
    token_type: str
    role: str


class TokenData(SQLModel):
    username: Optional[str] = None


class ActivityWithSupervisors(SQLModel):
    """Activity grouped with list of supervisors assigned to it"""
    activity_name: str
    activity_id: int | None = None
    scheduled_dates: list[datetime]
    supervisor_count: int
    supervisors: list[UserRead]
