from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import ActivityTemplate, TemplateTodoItem, User
from schemas import (
    ActivityTemplateCreate,
    ActivityTemplateRead,
    ActivityTemplateUpdate,
    TemplateTodoItemCreate,
    TemplateTodoItemRead,
)
from routers.auth import get_current_preventionist

router = APIRouter(tags=["activity-templates"])


@router.post("/", response_model=ActivityTemplateRead, status_code=201)
def create_activity_template(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template: ActivityTemplateCreate,
):
    db_activity_template = ActivityTemplate.model_validate(activity_template)
    session.add(db_activity_template)
    session.commit()
    session.refresh(db_activity_template)
    return db_activity_template


@router.get("/", response_model=List[ActivityTemplateRead])
def read_activity_templates(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    activity_templates = session.exec(
        select(ActivityTemplate).offset(offset).limit(limit)
    ).all()
    return activity_templates


@router.get("/{activity_template_id}", response_model=ActivityTemplateRead)
def read_activity_template(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template_id: int,
):
    activity_template = session.get(ActivityTemplate, activity_template_id)
    if not activity_template:
        raise HTTPException(status_code=404, detail="Activity Template not found")
    return activity_template


@router.patch("/{activity_template_id}", response_model=ActivityTemplateRead)
def update_activity_template(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template_id: int,
    activity_template_update: ActivityTemplateUpdate,
):
    db_activity_template = session.get(ActivityTemplate, activity_template_id)
    if not db_activity_template:
        raise HTTPException(status_code=404, detail="Activity Template not found")

    activity_template_data = activity_template_update.model_dump(exclude_unset=True)
    for key, value in activity_template_data.items():
        setattr(db_activity_template, key, value)

    session.add(db_activity_template)
    session.commit()
    session.refresh(db_activity_template)
    return db_activity_template


@router.delete("/{activity_template_id}", status_code=204)
def delete_activity_template(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template_id: int,
):
    activity_template = session.get(ActivityTemplate, activity_template_id)
    if not activity_template:
        raise HTTPException(status_code=404, detail="Activity Template not found")
    session.delete(activity_template)
    session.commit()


@router.post(
    "/{activity_template_id}/items", response_model=TemplateTodoItemRead, status_code=201
)
def create_template_todo_item(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template_id: int,
    item: TemplateTodoItemCreate,
):
    activity_template = session.get(ActivityTemplate, activity_template_id)
    if not activity_template:
        raise HTTPException(status_code=404, detail="Activity Template not found")

    db_item = TemplateTodoItem.model_validate(item)
    db_item.template_id = activity_template_id
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@router.get("/{activity_template_id}/items", response_model=List[TemplateTodoItemRead])
def read_template_todo_items(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_preventionist)],
    activity_template_id: int,
):
    activity_template = session.get(ActivityTemplate, activity_template_id)
    if not activity_template:
        raise HTTPException(status_code=404, detail="Activity Template not found")
    return activity_template.template_todos
