from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import TemplateTodoItem, User
from schemas import (
    TemplateTodoItemCreate,
    TemplateTodoItemRead,
    TemplateTodoItemUpdate,
)
from routers.auth import get_current_preventionist

router = APIRouter(tags=["todos-template"])


@router.post("/", response_model=TemplateTodoItemRead, status_code=201)
def create_template_todo_item(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    item: TemplateTodoItemCreate,
):
    db_item = TemplateTodoItem.model_validate(item)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@router.get("/", response_model=List[TemplateTodoItemRead])
def read_template_todo_items(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    items = session.exec(select(TemplateTodoItem).offset(offset).limit(limit)).all()
    return items


@router.get("/{item_id}", response_model=TemplateTodoItemRead)
def read_template_todo_item(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    item_id: int,
):
    item = session.get(TemplateTodoItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Template Todo Item not found")
    return item


@router.patch("/{item_id}", response_model=TemplateTodoItemRead)
def update_template_todo_item(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    item_id: int,
    item_update: TemplateTodoItemUpdate,
):
    db_item = session.get(TemplateTodoItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Template Todo Item not found")

    item_data = item_update.model_dump(exclude_unset=True)
    for key, value in item_data.items():
        setattr(db_item, key, value)

    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=204)
def delete_template_todo_item(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    item_id: int,
):
    item = session.get(TemplateTodoItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Template Todo Item not found")
    session.delete(item)
    session.commit()
