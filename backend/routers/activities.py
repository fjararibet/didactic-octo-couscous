from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Activity, User, ActivityTemplate, TodoItem, TodoStatus
from schemas import (
    ActivityCreate,
    ActivityRead,
    ActivityUpdate,
    ActivityWithSupervisors,
    UserRead,
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
    # Check if the assigned user exists
    assigned_user = session.get(User, activity.assigned_to_id)
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

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
                status=TodoStatus.pending,
                activity=db_activity,
            )
            session.add(todo_item)

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)

    # Refresh relationships to ensure they are loaded in the response
    session.refresh(db_activity, attribute_names=["created_by", "assigned_to", "todos"])

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


@router.get("/by-assignee/{assignee_id}", response_model=List[ActivityRead])
def read_activities_by_assignee(
    *,
    session: Session = Depends(get_session),
    assignee_id: int,
):
    activities = session.exec(
        select(Activity).where(Activity.assigned_to_id == assignee_id)
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
    
    # Check if setting in_review=True, ensure all todos are completed
    if activity_data.get("in_review"):
        # We need to check the current todos status
        # Since db_activity.todos might not be fully loaded or updated in this session if we rely on lazy loading without refresh?
        # But we fetched db_activity with session.get, so relationships might be lazy.
        # Let's verify via a query to be safe and efficient.
        pending_todos = session.exec(
            select(TodoItem).where(
                TodoItem.activity_id == activity_id,
                TodoItem.status == TodoStatus.pending
            )
        ).all()
        
        if pending_todos:
             raise HTTPException(
                status_code=400, 
                detail="Cannot set activity to in_review while there are pending todos."
            )

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


@router.get("/grouped-by-name/{creator_id}", response_model=List[ActivityWithSupervisors])
def get_activities_grouped_by_name(
    *,
    session: Session = Depends(get_session),
    creator_id: int,
):
    """
    Get activities grouped by name for a specific creator (preventionist).
    Returns a list where each item contains:
    - activity_name: The name of the activity
    - activity_id: One of the activity IDs (for reference)
    - scheduled_dates: List of all scheduled dates for this activity
    - supervisor_count: Number of supervisors assigned to this activity
    - supervisors: List of unique supervisors assigned to this activity
    """
    # Get all activities created by this user
    activities = session.exec(
        select(Activity).where(Activity.created_by_id == creator_id)
    ).all()

    # Group activities by name
    activities_by_name: dict[str, list[Activity]] = {}
    for activity in activities:
        if activity.name not in activities_by_name:
            activities_by_name[activity.name] = []
        activities_by_name[activity.name].append(activity)

    # Build response
    result: list[ActivityWithSupervisors] = []
    for activity_name, activity_list in activities_by_name.items():
        # Get unique supervisors
        supervisor_ids: set[int] = set()
        supervisors_list: list[UserRead] = []
        scheduled_dates: list = []

        for activity in activity_list:
            if activity.scheduled_date:
                scheduled_dates.append(activity.scheduled_date)

            if activity.assigned_to_id and activity.assigned_to_id not in supervisor_ids:
                supervisor_ids.add(activity.assigned_to_id)
                if activity.assigned_to:
                    supervisors_list.append(
                        UserRead(
                            id=activity.assigned_to.id,
                            username=activity.assigned_to.username,
                            email=activity.assigned_to.email,
                            role=activity.assigned_to.role,
                        )
                    )

        result.append(
            ActivityWithSupervisors(
                activity_name=activity_name,
                activity_id=activity_list[0].id if activity_list else None,
                scheduled_dates=sorted(scheduled_dates),
                supervisor_count=len(supervisors_list),
                supervisors=supervisors_list,
            )
        )

    return result
