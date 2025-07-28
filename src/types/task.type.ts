// types/task.type.ts

export interface Task {
  task_id: string;
  task_title: string;
  start_date: Date;
  end_date: Date;
  time_spent: TimeSpent[];
  create_by: string;
  assign_to: string;
}

export interface CreateTask {
  columnId: string;
  task_title: string;
  start_date: Date;
  end_date: Date;
  time_spent: TimeSpent[];
  create_by: string;
  assign_to: string;
}

export interface TimeSpent {
  spent: string;
  create_at: Date;
  update_at: Date;
}
