from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import TodoItem
from schemas import TodoItemCreate, TodoItemRead, TodoItemUpdate

router = APIRouter(tags=["todos"])

@router.post("/", response_model=TodoItemRead, status_code=201)
def create_todo_item(*, session: Session = Depends(get_session), todo_item: TodoItemCreate):
    db_todo_item = TodoItem.model_validate(todo_item)
    session.add(db_todo_item)
    session.commit()
    session.refresh(db_todo_item)
    return db_todo_item

@router.get("/", response_model=List[TodoItemRead])
def read_todo_items(
    *,
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    todo_items = session.exec(select(TodoItem).offset(offset).limit(limit)).all()
    return todo_items

@router.get("/{todo_item_id}", response_model=TodoItemRead)
def read_todo_item(*, session: Session = Depends(get_session), todo_item_id: int):
    todo_item = session.get(TodoItem, todo_item_id)
    if not todo_item:
        raise HTTPException(status_code=404, detail="TodoItem not found")
    return todo_item

@router.patch("/{todo_item_id}", response_model=TodoItemRead)
def update_todo_item(
    *,
    session: Session = Depends(get_session),
    todo_item_id: int,
    todo_item_update: TodoItemUpdate,
):
    db_todo_item = session.get(TodoItem, todo_item_id)
    if not db_todo_item:
        raise HTTPException(status_code=404, detail="TodoItem not found")
    
    todo_item_data = todo_item_update.model_dump(exclude_unset=True)
    for key, value in todo_item_data.items():
        setattr(db_todo_item, key, value)
        
    session.add(db_todo_item)
    session.commit()
    session.refresh(db_todo_item)
    return db_todo_item

@router.delete("/{todo_item_id}", status_code=204)
def delete_todo_item(*, session: Session = Depends(get_session), todo_item_id: int):
    todo_item = session.get(TodoItem, todo_item_id)
    if not todo_item:
        raise HTTPException(status_code=404, detail="TodoItem not found")
    session.delete(todo_item)
    session.commit()
