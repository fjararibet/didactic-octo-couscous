from typing import cast
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Activity
from datetime import datetime, timedelta

router = APIRouter(prefix="/activity/statuses_stats", tags=["activity-stats"])


@router.get("/{user_id}")
def get_activity_stats(
    user_id: int,
    session: Session = Depends(get_session),
):
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(
        day=1
    ) - timedelta(seconds=1)

    activities = session.exec(
        select(Activity).where(
            Activity.assigned_to_id == user_id,
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


@router.get("/detailed/{user_id}")
def get_detailed_activity_stats(
    user_id: int,
    session: Session = Depends(get_session),
):
    """Get detailed statistics for a supervisor"""
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    
    # Previous month for comparison
    start_of_prev_month = (start_of_month - timedelta(days=1)).replace(day=1)
    end_of_prev_month = start_of_month - timedelta(seconds=1)

    # Current month activities
    current_activities = session.exec(
        select(Activity).where(
            Activity.assigned_to_id == user_id,
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= start_of_month,
            cast(datetime, Activity.scheduled_date) <= end_of_month,
        )
    ).all()

    # Previous month activities
    prev_activities = session.exec(
        select(Activity).where(
            Activity.assigned_to_id == user_id,
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= start_of_prev_month,
            cast(datetime, Activity.scheduled_date) <= end_of_prev_month,
        )
    ).all()

    # Upcoming activities (next 7 days)
    upcoming_activities = session.exec(
        select(Activity).where(
            Activity.assigned_to_id == user_id,
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= now,
            cast(datetime, Activity.scheduled_date) <= now + timedelta(days=7),
        )
    ).all()

    # Calculate stats for current month
    stats = {"pending": 0, "done": 0, "in_progress": 0, "missed": 0}
    total_todos = 0
    completed_todos = 0
    
    for activity in current_activities:
        if activity.scheduled_date and activity.scheduled_date < now - timedelta(hours=24):
            stats["missed"] += 1
            continue

        activity_total = len(activity.todos)
        activity_done = sum(1 for todo in activity.todos if todo.is_done)
        
        total_todos += activity_total
        completed_todos += activity_done

        if activity_total == 0:
            stats["pending"] += 1
        elif activity_done == 0:
            stats["pending"] += 1
        elif activity_done == activity_total:
            stats["done"] += 1
        else:
            stats["in_progress"] += 1

    # Calculate previous month stats for comparison
    prev_stats = {"done": 0, "total": len(prev_activities)}
    for activity in prev_activities:
        activity_total = len(activity.todos)
        activity_done = sum(1 for todo in activity.todos if todo.is_done)
        if activity_total > 0 and activity_done == activity_total:
            prev_stats["done"] += 1

    # Calculate completion rates
    current_total = len(current_activities)
    completion_rate = (stats["done"] / current_total * 100) if current_total > 0 else 0
    prev_completion_rate = (prev_stats["done"] / prev_stats["total"] * 100) if prev_stats["total"] > 0 else 0
    
    # Calculate average task completion
    avg_task_completion = (completed_todos / total_todos * 100) if total_todos > 0 else 0

    return {
        "status_distribution": stats,
        "total_activities": current_total,
        "upcoming_activities": len(upcoming_activities),
        "completion_rate": round(completion_rate, 1),
        "prev_completion_rate": round(prev_completion_rate, 1),
        "completion_trend": round(completion_rate - prev_completion_rate, 1),
        "avg_task_completion": round(avg_task_completion, 1),
        "total_tasks": total_todos,
        "completed_tasks": completed_todos,
    }
