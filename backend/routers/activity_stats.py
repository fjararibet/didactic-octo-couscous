from typing import cast
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Activity, User
from datetime import datetime, timedelta

from routers.auth import get_current_user

router = APIRouter(prefix="/activity/stats", tags=["activity-stats"])


@router.get("/")
def get_activity_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(
        day=1
    ) - timedelta(seconds=1)

    activities = session.exec(
        select(Activity).where(
            Activity.assigned_to_id == current_user.id,
            Activity.scheduled_date is not None,  # Ensure scheduled_date is not None
            cast(datetime, Activity.scheduled_date) >= start_of_month,
            cast(datetime, Activity.scheduled_date) <= end_of_month,
        )
    ).all()

    stats = {"pending": 0, "done": 0, "in_progress": 0, "missed": 0}

    for activity in activities:
        if activity.scheduled_date and activity.scheduled_date < now - timedelta(
            hours=24
        ):
            stats["missed"] += 1
            continue

        total_todos = len(activity.todos)
        if total_todos == 0:
            stats["pending"] += 1
            continue

        done_todos = sum(1 for todo in activity.todos if todo.is_done)

        if done_todos == 0:
            stats["pending"] += 1
        elif done_todos == total_todos:
            stats["done"] += 1
        else:
            stats["in_progress"] += 1

    return stats
