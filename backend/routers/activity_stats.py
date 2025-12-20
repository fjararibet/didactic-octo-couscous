from typing import cast
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, col
from database import get_session
from models import Activity, User, Role, SupervisorAssignment
from datetime import datetime, timedelta
from routers.auth import get_current_user

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


@router.get("/general/detailed")
def get_general_activity_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get detailed statistics for all supervisors assigned to the preventionist"""
    if current_user.role != Role.preventionist:
        raise HTTPException(status_code=403, detail="Only preventionists can access this endpoint")

    # Get all supervisors assigned to this preventionist
    supervisors_query = select(SupervisorAssignment.supervisor_id).where(
        SupervisorAssignment.preventionist_id == current_user.id
    )
    supervisor_ids = session.exec(supervisors_query).all()
    
    if not supervisor_ids:
        return {
            "status_distribution": {"pending": 0, "done": 0, "in_progress": 0, "missed": 0},
            "total_activities": 0,
            "upcoming_activities": 0,
            "completion_rate": 0,
            "prev_completion_rate": 0,
            "completion_trend": 0,
            "avg_task_completion": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
        }

    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    
    # Previous month for comparison
    start_of_prev_month = (start_of_month - timedelta(days=1)).replace(day=1)
    end_of_prev_month = start_of_month - timedelta(seconds=1)

    # Current month activities for ALL supervisors
    current_activities = session.exec(
        select(Activity).where(
            col(Activity.assigned_to_id).in_(supervisor_ids),
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= start_of_month,
            cast(datetime, Activity.scheduled_date) <= end_of_month,
        )
    ).all()

    # Previous month activities for ALL supervisors
    prev_activities = session.exec(
        select(Activity).where(
            col(Activity.assigned_to_id).in_(supervisor_ids),
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= start_of_prev_month,
            cast(datetime, Activity.scheduled_date) <= end_of_prev_month,
        )
    ).all()

    # Upcoming activities (next 7 days) for ALL supervisors
    upcoming_activities = session.exec(
        select(Activity).where(
            col(Activity.assigned_to_id).in_(supervisor_ids),
            Activity.scheduled_date is not None,
            cast(datetime, Activity.scheduled_date) >= now,
            cast(datetime, Activity.scheduled_date) <= now + timedelta(days=7),
        )
    ).all()

    # Fetch supervisors info for detailed breakdown
    supervisors = session.exec(select(User).where(col(User.id).in_(supervisor_ids))).all()
    supervisors_map = {s.id: s for s in supervisors}

    # Calculate stats for current month
    stats = {"pending": 0, "done": 0, "in_progress": 0, "missed": 0}
    total_todos = 0
    completed_todos = 0
    
    # Per supervisor stats bucket
    supervisor_buckets = {s_id: {"assigned": 0, "completed": 0, "completed_on_time": 0, "late": 0} for s_id in supervisor_ids}

    for activity in current_activities:
        # Update General Stats
        if activity.scheduled_date and activity.scheduled_date < now - timedelta(hours=24):
            stats["missed"] += 1
            # Note: We continue here in the original logic, effectively skipping todo counting for "missed" activities in the general stats.
            # However, for the detailed table, we still want to process this activity to count it as "late" or "completed".
            # To preserve exact behavior of general stats while getting accurate table data, we need to be careful.
            # The original logic uses 'continue'. We should probably calculate table stats BEFORE the continue, or separately.
            pass 
        
        # We will separate the general stats logic loop from the supervisor stats loop to avoid regression or complex branching, 
        # but since we are iterating the same list, we can do both if we are careful.
        # Actually, let's keep the general stats logic EXACTLY as is to avoid regression, and add the supervisor stats logic in parallel.
        
        # --- General Stats Logic (Preserved) ---
        is_missed_general = False
        if activity.scheduled_date and activity.scheduled_date < now - timedelta(hours=24):
            is_missed_general = True
            
        if is_missed_general:
             stats["missed"] += 1
             # Original logic continues here. We won't continue the loop, but we will skip the rest of general stats calculation for this item.
        else:
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
        
        # --- Supervisor Detailed Stats Logic ---
        s_id = activity.assigned_to_id
        if s_id in supervisor_buckets:
            bucket = supervisor_buckets[s_id]
            bucket["assigned"] += 1
            
            is_done = False
            if activity.todos:
                done_todos = sum(1 for todo in activity.todos if todo.is_done)
                if done_todos == len(activity.todos) and len(activity.todos) > 0:
                    is_done = True
            
            if is_done:
                bucket["completed"] += 1
                # Check for on time / late
                if activity.finished_date and activity.scheduled_date:
                    if activity.finished_date <= activity.scheduled_date:
                        bucket["completed_on_time"] += 1
                    else:
                        bucket["late"] += 1
                else:
                    # If finished_date is missing, we can't determine "On Time".
                    # But if it's done, it's definitely completed.
                    pass
            else:
                # Not done. Check if late (past scheduled date)
                if activity.scheduled_date and activity.scheduled_date < now:
                    bucket["late"] += 1

    # Calculate previous month stats for comparison
    prev_stats = {"done": 0, "total": len(prev_activities)}
    for activity in prev_activities:
        activity_total = len(activity.todos)
        activity_done = sum(1 for todo in activity.todos if todo.is_done)
        if activity_total > 0 and activity_done == activity_total:
            prev_stats["done"] += 1

    # Format supervisor stats for response
    supervisors_stats = []
    for s_id, bucket in supervisor_buckets.items():
        supervisor = supervisors_map.get(s_id)
        if supervisor:
             supervisors_stats.append({
                 "id": s_id,
                 "name": supervisor.username,
                 "assigned": bucket["assigned"],
                 "completed": bucket["completed"],
                 "completed_on_time": bucket["completed_on_time"],
                 "late": bucket["late"]
             })

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
        "supervisors_stats": supervisors_stats
    }
