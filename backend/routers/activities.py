from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Activity, User, ActivityTemplate, TodoItem
from schemas import (
    ActivityCreate,
    ActivityRead,
    ActivityUpdate,
)
from routers.auth import get_current_user

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("/", response_model=ActivityRead, status_code=201)
def create_activity(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_user)],
    activity: ActivityCreate,
):
    db_activity = Activity.model_validate(activity)
    db_activity.created_by_id = current_user.id

    if activity.activity_template_id:
        template = session.get(ActivityTemplate, activity.activity_template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Activity Template not found")
        
        db_activity.name = template.name
        
        for template_todo in template.template_todos:
            todo_item = TodoItem(
                description=template_todo.description,
                is_done=False,
                activity=db_activity,
            )
            session.add(todo_item)

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)

    session.refresh(db_activity, attribute_names=["created_by", "assigned_to"])

    return db_activity


@router.get("/", response_model=List[ActivityRead])
def read_activities(
    *,
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(default=100, le=100),
):
    activities = session.exec(select(Activity).offset(offset).limit(limit)).all()
    return activities


@router.get("/by-creator/{creator_id}", response_model=List[ActivityRead])
def read_activities_by_creator(
    *,
    session: Session = Depends(get_session),
    creator_id: int,
):
    activities = session.exec(
        select(Activity).where(Activity.created_by_id == creator_id)
    ).all()
    return activities


@router.get("/{activity_id}", response_model=ActivityRead)
def read_activity(*, session: Session = Depends(get_session), activity_id: int):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(
    *,
    session: Session = Depends(get_session),
    activity_id: int,
    activity_update: ActivityUpdate,
):
    db_activity = session.get(Activity, activity_id)
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity_data = activity_update.model_dump(exclude_unset=True)
    for key, value in activity_data.items():
        setattr(db_activity, key, value)
        
    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)
    return db_activity

@router.delete("/{activity_id}", status_code=204)
def delete_activity(*, session: Session = Depends(get_session), activity_id: int):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    session.delete(activity)
    session.commit()
