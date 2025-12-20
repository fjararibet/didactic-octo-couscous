import random
import uuid
from sqlmodel import Session, delete
from database import engine
from models import User, Role, Status, SupervisorAssignment, Activity, TodoItem
from security import get_password_hash

# Static Data for Activities and their potential Todos
ACTIVITIES_DATA = [
    {
        "name": "Inspección de Trabajo en Altura",
        "todos": [
            "Verificar estado de arnés de seguridad",
            "Revisar líneas de vida y puntos de anclaje",
            "Comprobar señalización del área inferior",
            "Validar permisos de trabajo en altura",
            "Inspeccionar estado de escaleras y andamios"
        ]
    },
    {
        "name": "Control de EPP",
        "todos": [
            "Verificar uso de casco de seguridad",
            "Revisar calzado de seguridad",
            "Comprobar uso de gafas protectoras",
            "Validar estado de guantes",
            "Confirmar uso de protección auditiva si aplica"
        ]
    },
    {
        "name": "Revisión de Extintores",
        "todos": [
            "Verificar fecha de vencimiento",
            "Comprobar presión del manómetro",
            "Revisar estado de la manguera y boquilla",
            "Confirmar señalización y acceso despejado",
            "Validar precinto de seguridad"
        ]
    },
    {
        "name": "Inspección Eléctrica",
        "todos": [
            "Revisar estado de cables y extensiones",
            "Verificar tableros eléctricos cerrados",
            "Comprobar señalización de riesgo eléctrico",
            "Validar bloqueo y etiquetado (LOTO) si aplica",
            "Inspeccionar herramientas eléctricas manuales"
        ]
    },
    {
        "name": "Control de Excavaciones",
        "todos": [
            "Verificar entibados y taludes",
            "Revisar accesos y salidas de la zanja",
            "Comprobar ausencia de agua acumulada",
            "Validar barreras perimetrales",
            "Inspeccionar maquinaria cercana al borde"
        ]
    },
    {
        "name": "Orden y Limpieza (5S)",
        "todos": [
            "Verificar pasillos libres de obstáculos",
            "Revisar clasificación de residuos",
            "Comprobar almacenamiento de materiales",
            "Validar limpieza de áreas comunes",
            "Inspeccionar señalización de emergencia"
        ]
    },
    {
        "name": "Seguridad Vial en Obra",
        "todos": [
            "Verificar señalización vial",
            "Revisar estado de vehículos y maquinaria",
            "Comprobar uso de chalecos reflectantes",
            "Validar rutas de circulación peatonal",
            "Inspeccionar límites de velocidad"
        ]
    }
]

def clear_db(session: Session):
    print("Clearing existing data...")
    session.exec(delete(TodoItem))
    session.exec(delete(Activity))
    session.exec(delete(SupervisorAssignment))
    session.exec(delete(User))
    session.commit()

def populate():
    print("Starting database population...")
    session = Session(engine)
    
    clear_db(session)
    
    hashed_password = get_password_hash("pass")
    
    # Create 5 Preventionists
    preventionists = []
    print("Creating Preventionists...")
    for i in range(5):
        uid = str(uuid.uuid4())[:8]
        username = f"prev_{uid}"
        email = f"prev_{uid}@example.com"
        
        user = User(
            username=username,
            email=email,
            role=Role.preventionist,
            password_hash=hashed_password
        )
        session.add(user)
        preventionists.append(user)
    
    session.commit()
    for p in preventionists:
        session.refresh(p)
        
    print(f"Created {len(preventionists)} preventionists.")

    print("Creating Supervisors and Assignments...")
    
    total_supervisors = 0
    total_activities = 0
    
    for prev in preventionists:
        # Each preventionist has between 5 and 20 supervisors
        num_supervisors = random.randint(5, 20)
        
        for j in range(num_supervisors):
            uid = str(uuid.uuid4())[:8]
            username = f"sup_{uid}"
            email = f"sup_{uid}@example.com"
            
            supervisor = User(
                username=username,
                email=email,
                role=Role.supervisor,
                password_hash=hashed_password
            )
            session.add(supervisor)
            session.commit()
            session.refresh(supervisor)
            
            # Create Assignment
            assignment = SupervisorAssignment(
                supervisor_id=supervisor.id,
                preventionist_id=prev.id
            )
            session.add(assignment)
            
            # Create Activities for this Supervisor
            # Randomly assign 2 to 5 activities per supervisor
            num_activities = random.randint(2, 5) 
            
            for _ in range(num_activities):
                act_data = random.choice(ACTIVITIES_DATA)
                
                activity = Activity(
                    name=act_data["name"],
                    status=Status.pending,
                    scheduled_date=None, 
                    assigned_to_id=supervisor.id,
                    created_by_id=prev.id
                )
                session.add(activity)
                session.commit()
                session.refresh(activity)
                
                # Create Todos for this Activity
                # Always use all todos defined for the activity type
                for todo_desc in act_data["todos"]:
                    todo = TodoItem(
                        description=todo_desc,
                        is_done=False,
                        activity_id=activity.id
                    )
                    session.add(todo)
                
                total_activities += 1
            
            total_supervisors += 1
            
    session.commit()
    print(f"Finished! Created {total_supervisors} Supervisors and {total_activities} Activities.")

if __name__ == "__main__":
    populate()
