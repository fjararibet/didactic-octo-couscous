from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field
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


# Shared properties
class ActivityBase(SQLModel):
    name: str
    status: Status = Status.pending
    scheduled_date: datetime
    finished_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

# Properties to receive on item creation
class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(SQLModel):
    name: Optional[str] = None
    status: Optional[Status] = None
    scheduled_date: Optional[datetime] = None
    finished_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class ActivityRead(ActivityBase):
    id: int
    created_by_id: Optional[int] = None


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


class Token(SQLModel):
    access_token: str
    token_type: str
    role: str


class TokenData(SQLModel):
    username: Optional[str] = None
