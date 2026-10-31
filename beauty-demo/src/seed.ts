import type { DB } from './types';

function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function buildSeed(): DB {
  const masters = [
    { id: 1, full_name: 'Анна Петрова', phone: '+7 900 111-22-33', specialization: 'Парикмахер-стилист', active: true },
    { id: 2, full_name: 'Мария Иванова', phone: '+7 900 222-33-44', specialization: 'Мастер маникюра', active: true },
    { id: 3, full_name: 'Ольга Смирнова', phone: '+7 900 333-44-55', specialization: 'Косметолог', active: true },
  ];

  const procedures = [
    { id: 1, name: 'Стрижка женская', duration_min: 60, price: 2500, active: true },
    { id: 2, name: 'Стрижка мужская', duration_min: 30, price: 1500, active: true },
    { id: 3, name: 'Окрашивание', duration_min: 120, price: 5500, active: true },
    { id: 4, name: 'Маникюр классический', duration_min: 60, price: 1800, active: true },
    { id: 5, name: 'Маникюр + покрытие', duration_min: 90, price: 2800, active: true },
    { id: 6, name: 'Педикюр', duration_min: 90, price: 3000, active: true },
    { id: 7, name: 'Чистка лица', duration_min: 90, price: 4500, active: true },
    { id: 8, name: 'Массаж лица', duration_min: 45, price: 2200, active: true },
    { id: 9, name: 'Брови / коррекция', duration_min: 30, price: 900, active: true },
    { id: 10, name: 'Ламинирование ресниц', duration_min: 90, price: 3500, active: true },
  ];

  const clients = [
    { id: 1, full_name: 'Екатерина Соколова', phone: '+7 911 100-20-30', created_at: new Date().toISOString() },
    { id: 2, full_name: 'Дмитрий Волков', phone: '+7 911 200-30-40', created_at: new Date().toISOString() },
    { id: 3, full_name: 'Ирина Кузнецова', phone: '+7 911 300-40-50', created_at: new Date().toISOString() },
    { id: 4, full_name: 'Алексей Морозов', phone: '+7 911 400-50-60', created_at: new Date().toISOString() },
    { id: 5, full_name: 'Наталья Попова', phone: '+7 911 500-60-70', created_at: new Date().toISOString() },
  ];

  const start = todayAt(10, 0);
  const mk = (offsetMin: number, durMin: number) => ({
    s: new Date(new Date(start).getTime() + offsetMin * 60000).toISOString(),
    e: new Date(new Date(start).getTime() + (offsetMin + durMin) * 60000).toISOString(),
  });

  const a1 = mk(0, 60);
  const a2 = mk(90, 90);
  const a3 = mk(120, 90);
  const a4 = mk(240, 30);
  const a5 = mk(300, 60);

  const appointments = [
    { id: 1, client_id: 1, master_id: 1, procedure_id: 1, start_datetime: a1.s, end_datetime: a1.e, status: 'planned', price_final: 2500, payment_method: 'none' as const },
    { id: 2, client_id: 3, master_id: 2, procedure_id: 5, start_datetime: a2.s, end_datetime: a2.e, status: 'planned', price_final: 2800, payment_method: 'none' as const },
    { id: 3, client_id: 5, master_id: 3, procedure_id: 7, start_datetime: a3.s, end_datetime: a3.e, status: 'planned', price_final: 4500, payment_method: 'none' as const },
    { id: 4, client_id: 2, master_id: 1, procedure_id: 2, start_datetime: a4.s, end_datetime: a4.e, status: 'planned', price_final: 1500, payment_method: 'none' as const },
    { id: 5, client_id: 4, master_id: 2, procedure_id: 4, start_datetime: a5.s, end_datetime: a5.e, status: 'planned', price_final: 1800, payment_method: 'none' as const },
  ];

  return {
    clients,
    masters,
    procedures,
    appointments,
    settings: { salon_name: 'Beauty Studio', open_hour: 9, close_hour: 21 },
    users: [],
    nextIds: {
      clients: 6, masters: 4, procedures: 11, appointments: 6,
    },
  };
}