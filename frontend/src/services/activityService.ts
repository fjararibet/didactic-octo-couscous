import type { Activity, CreateActivityDto, CreateTodoDto, TodoItem } from '@/types/activity';

// Mock data storage
let activities: Activity[] = [
  {
    id: 1,
    name: 'Inspección de Extintores',
    status: 'pending',
    scheduled_date: '2025-12-20T10:00:00',
    finished_date: null,
    created_by_id: 1,
    assigned_to_id: 2,
    todos: [
      { id: 1, description: 'Revisar presión de extintores', is_done: false, activity_id: 1 },
      { id: 2, description: 'Verificar sellos de seguridad', is_done: false, activity_id: 1 },
      { id: 3, description: 'Documentar hallazgos', is_done: false, activity_id: 1 },
    ],
  },
  {
    id: 2,
    name: 'Capacitación de Seguridad',
    status: 'in_progress',
    scheduled_date: '2025-12-22T14:00:00',
    finished_date: null,
    created_by_id: 1,
    assigned_to_id: 2,
    todos: [
      { id: 4, description: 'Preparar material didáctico', is_done: true, activity_id: 2 },
      { id: 5, description: 'Reservar sala de capacitación', is_done: false, activity_id: 2 },
    ],
  },
  {
    id: 3,
    name: 'Auditoría de Salidas de Emergencia',
    status: 'done',
    scheduled_date: '2025-12-18T09:00:00',
    finished_date: '2025-12-18T11:30:00',
    created_by_id: 1,
    assigned_to_id: 2,
    todos: [
      { id: 6, description: 'Verificar señalización', is_done: true, activity_id: 3 },
      { id: 7, description: 'Probar iluminación de emergencia', is_done: true, activity_id: 3 },
      { id: 8, description: 'Generar reporte', is_done: true, activity_id: 3 },
    ],
  },
  {
    id: 4,
    name: 'Revisión de Equipos de Protección',
    status: 'pending',
    scheduled_date: '2025-12-25T11:00:00',
    finished_date: null,
    created_by_id: 1,
    assigned_to_id: 2,
    todos: [
      { id: 9, description: 'Inventario de cascos', is_done: false, activity_id: 4 },
      { id: 10, description: 'Revisar guantes de seguridad', is_done: false, activity_id: 4 },
    ],
  },
];

let nextActivityId = 5;
let nextTodoId = 11;

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const activityService = {
  // Get all activities for a user (preventionist shows created activities)
  async getActivitiesByCreator(userId: number): Promise<Activity[]> {
    await delay(300);
    return activities.filter(activity => activity.created_by_id === userId);
  },

  // Get a single activity by ID
  async getActivityById(id: number): Promise<Activity | null> {
    await delay(200);
    return activities.find(activity => activity.id === id) || null;
  },

  // Create a new activity
  async createActivity(data: CreateActivityDto, creatorId: number): Promise<Activity> {
    await delay(400);
    const newActivity: Activity = {
      id: nextActivityId++,
      name: data.name,
      status: 'pending',
      scheduled_date: data.scheduled_date,
      finished_date: null,
      created_by_id: creatorId,
      assigned_to_id: data.assigned_to_id || null,
      todos: [],
    };
    activities.push(newActivity);
    return newActivity;
  },

  // Update activity status
  async updateActivityStatus(id: number, status: Activity['status']): Promise<Activity | null> {
    await delay(300);
    const activity = activities.find(a => a.id === id);
    if (activity) {
      activity.status = status;
      if (status === 'done' && !activity.finished_date) {
        activity.finished_date = new Date().toISOString();
      }
    }
    return activity || null;
  },

  // Add a todo to an activity
  async addTodoToActivity(data: CreateTodoDto): Promise<TodoItem> {
    await delay(300);
    const activity = activities.find(a => a.id === data.activity_id);
    if (!activity) {
      throw new Error('Activity not found');
    }

    const newTodo: TodoItem = {
      id: nextTodoId++,
      description: data.description,
      is_done: false,
      activity_id: data.activity_id,
    };

    activity.todos.push(newTodo);
    return newTodo;
  },

  // Toggle todo status (for supervisor role, but we'll include it)
  async toggleTodoStatus(todoId: number): Promise<TodoItem | null> {
    await delay(200);
    for (const activity of activities) {
      const todo = activity.todos.find(t => t.id === todoId);
      if (todo) {
        todo.is_done = !todo.is_done;
        return todo;
      }
    }
    return null;
  },
};