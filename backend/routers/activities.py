from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Activity
from schemas import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter(prefix="/activities", tags=["activities"])

@router.post("/", response_model=ActivityRead, status_code=201)
def create_activity(*, session: Session = Depends(get_session), activity: ActivityCreate):
    # For now, we assume created_by_id is passed or handled via auth later. 
    # Since ActivityCreate doesn't have created_by_id, we might default it or leave it None.
    # The prompt asked for basic CRUD, so we'll just map the fields.
    # Note: A real app would get the current user from the token.
    db_activity = Activity.model_validate(activity)
    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)
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
