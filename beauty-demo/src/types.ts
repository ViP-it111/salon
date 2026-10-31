export type Role = 'admin' | 'master';

export interface User {
  username: string;
  passwordHash: string; // sha-256, ДЕМО — не для продакшена
  role: Role;
}

export interface Client {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string; // ISO
}

export interface Master {
  id: number;
  full_name: string;
  phone?: string;
  specialization?: string;
  active: boolean;
}

export interface Procedure {
  id: number;
  name: string;
  duration_min: number;
  price: number;
  description?: string;
  active: boolean;
}

export type AppointmentStatus = 'planned' | 'done' | 'cancelled' | 'no_show';

export interface Appointment {
  id: number;
  client_id: number;
  master_id: number;
  procedure_id: number;
  start_datetime: string; // ISO
  end_datetime: string;   // ISO
  status: AppointmentStatus;
  price_final: number;
  payment_method?: 'cash' | 'card' | 'none';
  comment?: string;
}

export interface Settings {
  salon_name: string;
  open_hour: number;
  close_hour: number;
}

export interface DB {
  clients: Client[];
  masters: Master[];
  procedures: Procedure[];
  appointments: Appointment[];
  settings: Settings;
  users: User[];
  nextIds: Record<string, number>;
}