import random
import uuid
from sqlmodel import Session, delete, select
from database import engine
from models import (
    User,
    Role,
    Status,
    SupervisorAssignment,
    Activity,
    TodoItem,
    ActivityTemplate,
    TemplateTodoItem,
)
from security import get_password_hash

# Listas de nombres y apellidos en español
NOMBRES = [
    "Carlos", "María", "José", "Ana", "Luis", "Carmen", "Miguel", "Isabel",
    "Francisco", "Rosa", "Antonio", "Patricia", "Juan", "Laura", "Pedro",
    "Elena", "Javier", "Lucía", "Manuel", "Sofía", "Ricardo", "Marta",
    "Diego", "Cristina", "Alejandro", "Paula", "Fernando", "Andrea",
    "Roberto", "Beatriz", "Sergio", "Raquel", "Jorge", "Silvia", "Pablo",
    "Teresa", "Andrés", "Natalia", "Ramón", "Pilar", "Enrique", "Victoria",
    "Alberto", "Daniela", "Raúl", "Gabriela", "Daniel", "Claudia", "Tomás",
    "Adriana", "Ángel", "Lorena", "Guillermo", "Susana", "Rafael", "Mónica"
]

APELLIDOS = [
    "García", "Rodríguez", "González", "Fernández", "López", "Martínez",
    "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández",
    "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez",
    "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez",
    "Serrano", "Blanco", "Molina", "Castro", "Ortega", "Rubio", "Marín",
    "Sanz", "Iglesias", "Medina", "Garrido", "Cortés", "Castillo", "Santos",
    "Lozano", "Guerrero", "Cano", "Prieto", "Méndez", "Cruz", "Gallego",
    "Vidal", "León", "Herrera", "Peña", "Flores", "Cabrera", "Campos"
]


def generar_nombre_completo() -> str:
    """Genera un nombre completo aleatorio en español."""
    nombre = random.choice(NOMBRES)
    apellido1 = random.choice(APELLIDOS)
    apellido2 = random.choice(APELLIDOS)
    return f"{nombre} {apellido1} {apellido2}"


def clear_db(session: Session):
    print("Clearing existing data...")
    session.exec(delete(TodoItem))
    session.exec(delete(Activity))
    session.exec(delete(SupervisorAssignment))
    session.exec(delete(User))
    session.exec(delete(TemplateTodoItem))
    session.exec(delete(ActivityTemplate))
    session.commit()


ACTIVITIES_DATA = [
    {
        "name": "Inspección de Trabajo en Altura",
        "todos": [
            "Verificar estado de arnés de seguridad",
            "Revisar líneas de vida y puntos de anclaje",
            "Comprobar señalización del área inferior",
            "Validar permisos de trabajo en altura",
            "Inspeccionar estado de escaleras y andamios",
        ],
    },
    {
        "name": "Control de EPP",
        "todos": [
            "Verificar uso de casco de seguridad",
            "Revisar calzado de seguridad",
            "Comprobar uso de gafas protectoras",
            "Validar estado de guantes",
            "Confirmar uso de protección auditiva si aplica",
        ],
    },
    {
        "name": "Revisión de Extintores",
        "todos": [
            "Verificar fecha de vencimiento",
            "Comprobar presión del manómetro",
            "Revisar estado de la manguera y boquilla",
            "Confirmar señalización y acceso despejado",
            "Validar precinto de seguridad",
        ],
    },
    {
        "name": "Inspección Eléctrica",
        "todos": [
            "Revisar estado de cables y extensiones",
            "Verificar tableros eléctricos cerrados",
            "Comprobar señalización de riesgo eléctrico",
            "Validar bloqueo y etiquetado (LOTO) si aplica",
            "Inspeccionar herramientas eléctricas manuales",
        ],
    },
    {
        "name": "Control de Excavaciones",
        "todos": [
            "Verificar entibados y taludes",
            "Revisar accesos y salidas de la zanja",
            "Comprobar ausencia de agua acumulada",
            "Validar barreras perimetrales",
            "Inspeccionar maquinaria cercana al borde",
        ],
    },
    {
        "name": "Orden y Limpieza (5S)",
        "todos": [
            "Verificar pasillos libres de obstáculos",
            "Revisar clasificación de residuos",
            "Comprobar almacenamiento de materiales",
            "Validar limpieza de áreas comunes",
            "Inspeccionar señalización de emergencia",
        ],
    },
    {
        "name": "Seguridad Vial en Obra",
        "todos": [
            "Verificar señalización vial",
            "Revisar estado de vehículos y maquinaria",
            "Comprobar uso de chalecos reflectantes",
            "Validar rutas de circulación peatonal",
            "Inspeccionar límites de velocidad",
        ],
    },
    {
        "name": "Gestión de Residuos Peligrosos",
        "todos": [
            "Verificar etiquetado de contenedores",
            "Comprobar estado de bandejas de contención",
            "Revisar hojas de datos de seguridad (HDS)",
        ],
    },
    {
        "name": "Inspección de Grúas y Equipos de Izaje",
        "todos": [
            "Verificar certificación del operador",
            "Revisar estado de eslingas y grilletes",
            "Comprobar funcionamiento de alarmas de movimiento",
            "Validar tabla de cargas en cabina",
        ],
    },
    {
        "name": "Monitoreo de Ruido y Polvo",
        "todos": [
            "Realizar mediciones con sonómetro",
            "Verificar humectación de terrenos",
            "Comprobar uso de mascarillas P100",
        ],
    },
    {
        "name": "Revisión de Botiquines de Primeros Auxilios",
        "todos": [
            "Verificar vigencia de medicamentos e insumos",
            "Comprobar stock mínimo según inventario",
        ],
    },
    {
        "name": "Simulacro de Emergencia (Gabinete)",
        "todos": [
            "Evaluar tiempos de respuesta teóricos",
            "Revisar directorio de contactos de emergencia",
            "Validar conocimiento de rutas de evacuación",
            "Comprobar estado de megáfonos y radios",
        ],
    },
    {
        "name": "Inspección de Herramientas Manuales",
        "todos": [
            "Verificar ausencia de mangos astillados",
            "Revisar que no existan herramientas hechizas",
            "Comprobar limpieza y almacenamiento",
        ],
    },
    {
        "name": "Control de Sustancias Químicas",
        "todos": [
            "Revisar etiquetado SGA (Sistema Global Armonizado)",
            "Verificar almacenamiento en bodega ventilada",
            "Comprobar kit antiderrames cercano",
            "Validar compatibilidad química en el almacenamiento",
        ],
    },
    {
        "name": "Inspección de Andamios",
        "todos": [
            "Verificar tarjeta de 'Andamio Seguro' (verde)",
            "Revisar nivelación de las bases",
            "Comprobar presencia de barandas y rodapiés",
            "Validar estado de las plataformas y tablones",
        ],
    },
    {
        "name": "Protección Contra Incendios (Sistemas Fijos)",
        "todos": [
            "Inspeccionar red húmeda/seca",
            "Verificar señalética de pulsadores de alarma",
            "Comprobar despeje de detectores de humo",
            "Validar estado de bombas de incendio",
        ],
    },
    {
        "name": "Seguridad en Espacios Confinados",
        "todos": [
            "Validar medición de gases previa al ingreso",
            "Verificar presencia de vigía en el exterior",
            "Revisar equipo de ventilación forzada",
            "Comprobar sistema de comunicación y rescate",
        ],
    },
    {
        "name": "Manejo Manual de Cargas",
        "todos": [
            "Observar técnicas de levantamiento de carga",
            "Verificar cumplimiento de peso máximo permitido",
            "Comprobar disponibilidad de ayudas mecánicas",
            "Validar uso de guantes de agarre",
        ],
    },
    {
        "name": "Ergonomía en Puestos de Trabajo",
        "todos": [
            "Ajustar altura de sillas y monitores",
            "Verificar pausas activas programadas",
            "Comprobar iluminación adecuada en el puesto",
        ],
    },
    {
        "name": "Seguridad en Demoliciones",
        "todos": [
            "Verificar corte de servicios (agua/luz/gas)",
            "Comprobar apuntalamientos preventivos",
            "Revisar plan de retiro de escombros",
            "Validar uso de protección respiratoria especial",
        ],
    },
    {
        "name": "Señalética y Protecciones Colectivas",
        "todos": [
            "Inspeccionar estado de mallas de seguridad",
            "Verificar señalización de peligro de caída",
            "Comprobar delimitación de zonas de excavación",
            "Revisar estado de barandas perimetrales",
        ],
    },
    {
        "name": "Charlas de Seguridad (5 Minutos)",
        "todos": [
            "Verificar registro de asistencia firmado",
            "Validar pertinencia del tema con los riesgos del día",
            "Comprobar participación activa del personal",
        ],
    },
    {
        "name": "Control de Fatiga y Somnolencia",
        "todos": [
            "Revisar encuestas de inicio de jornada",
            "Verificar disponibilidad de puntos de hidratación",
            "Comprobar áreas de descanso con sombra",
        ],
    },
    {
        "name": "Trabajo con Calor (Soldadura/Oxicorte)",
        "todos": [
            "Verificar biombo protector contra chispas",
            "Comprobar extintor PQS a pie de obra",
            "Validar permiso de trabajo en caliente",
            "Revisar estado de mangueras y válvulas antirretroceso",
        ],
    },
    {
        "name": "Protección Radiológica (Densímetros)",
        "todos": [
            "Verificar delimitación de zona controlada",
            "Revisar uso de dosímetros personales",
            "Validar curso de protección radiológica del operador",
        ],
    },
]


def populate_activity_templates(session: Session):
    print("Populating activity templates...")
    for act_data in ACTIVITIES_DATA:
        template = ActivityTemplate(name=act_data["name"])
        session.add(template)
        session.commit()
        session.refresh(template)

        for todo_desc in act_data["todos"]:
            todo_template = TemplateTodoItem(
                description=todo_desc, template_id=template.id
            )
            session.add(todo_template)
    session.commit()
    print("Finished populating activity templates.")


def populate():
    print("Starting database population...")
    session = Session(engine)

    clear_db(session)
    populate_activity_templates(session)

    hashed_password = get_password_hash("pass")

    # Create Preventionists
    preventionists = []
    print("Creating Preventionists...")
    for i in range(1):
        nombre_completo = generar_nombre_completo()
        uid = str(uuid.uuid4())[:8]
        email = f"prev_{uid}@example.com"

        user = User(
            username=nombre_completo,
            email=email,
            role=Role.preventionist,
            password_hash=hashed_password,
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

    # Get all activity templates
    activity_templates = session.exec(select(ActivityTemplate)).all()

    for prev in preventionists:
        # Each preventionist has between 5 and 20 supervisors
        # num_supervisors = random.randint(5, 20)
        num_supervisors = 10

        for j in range(num_supervisors):
            nombre_completo = generar_nombre_completo()
            uid = str(uuid.uuid4())[:8]
            email = f"sup_{uid}@example.com"

            supervisor = User(
                username=nombre_completo,
                email=email,
                role=Role.supervisor,
                password_hash=hashed_password,
            )
            session.add(supervisor)
            session.commit()
            session.refresh(supervisor)

            # Create Assignment
            assignment = SupervisorAssignment(
                supervisor_id=supervisor.id, preventionist_id=prev.id
            )
            session.add(assignment)

            # Create Activities for this Supervisor
            # Randomly assign 2 to 5 activities per supervisor
            num_activities = random.randint(2, 5)

            for _ in range(num_activities):
                # Choose a random activity template
                template = random.choice(activity_templates)

                activity = Activity(
                    name=template.name,
                    status=Status.pending,
                    scheduled_date=None,
                    assigned_to_id=supervisor.id,
                    created_by_id=prev.id,
                )
                session.add(activity)
                session.commit()
                session.refresh(activity)

                # Create Todos for this Activity from the template
                for todo_template in template.template_todos:
                    todo = TodoItem(
                        description=todo_template.description,
                        is_done=False,
                        activity_id=activity.id,
                    )
                    session.add(todo)

                total_activities += 1

            total_supervisors += 1

    session.commit()
    print(
        f"Finished! Created {total_supervisors} Supervisors and {total_activities} Activities."
    )


if __name__ == "__main__":
    populate()
