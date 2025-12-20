from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import User, SupervisorAssignment, Role
from schemas import UserCreate, UserRead, SupervisorAssignmentCreate
from security import get_password_hash
from routers.auth import get_current_user

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/supervisors", response_model=List[UserRead])
def get_my_supervisors(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != Role.preventionist:
        raise HTTPException(status_code=403, detail="Only preventionists can access this endpoint")

    statement = (
        select(User)
        .join(SupervisorAssignment)
        .where(SupervisorAssignment.preventionist_id == current_user.id)
    )
    supervisors = session.exec(statement).all()
    return supervisors


@router.post("/assign-supervisor")
def assign_supervisor_to_preventionist(
    assignment: SupervisorAssignmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):

    supervisor = session.get(User, assignment.supervisor_id)
    preventionist = session.get(User, assignment.preventionist_id)

    if not supervisor or not preventionist:
        raise HTTPException(status_code=404, detail="User not found")

    if supervisor.role != Role.supervisor:
        raise HTTPException(status_code=400, detail="User is not a supervisor")

    if preventionist.role != Role.preventionist:
        raise HTTPException(status_code=400, detail="User is not a preventionist")

    existing_assignment = session.get(SupervisorAssignment, assignment.supervisor_id)
    if existing_assignment:
        existing_assignment.preventionist_id = assignment.preventionist_id
        session.add(existing_assignment)
    else:
        new_assignment = SupervisorAssignment(
            supervisor_id=assignment.supervisor_id,
            preventionist_id=assignment.preventionist_id
        )
        session.add(new_assignment)

    session.commit()
    return {"message": "Supervisor assigned successfully"}


@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    user_data = user.model_dump()
    password = user_data.pop("password")
    hashed_password = get_password_hash(password)

    db_user = User(**user_data, password_hash=hashed_password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
