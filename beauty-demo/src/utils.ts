import type { Appointment, DB } from './types';

export const pad = (n: number) => n.toString().padStart(2, '0');

export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtMoney(v: number): string {
  return v.toLocaleString('ru-RU') + ' ₽';
}

export function findConflicts(
  db: DB,
  masterId: number,
  startISO: string,
  durationMin: number,
  excludeId?: number,
): Appointment[] {
  const start = new Date(startISO).getTime();
  const end = start + durationMin * 60000;
  return db.appointments.filter((a) => {
    if (a.master_id !== masterId) return false;
    if (a.status === 'cancelled' || a.status === 'no_show') return false;
    if (excludeId && a.id === excludeId) return false;
    const s = new Date(a.start_datetime).getTime();
    const e = new Date(a.end_datetime).getTime();
    return start < e && end > s;
  });
}

export function statusColor(status: Appointment['status']): string {
  switch (status) {
    case 'planned': return 'bg-blue-500 border-blue-600';
    case 'done': return 'bg-emerald-500 border-emerald-600';
    case 'cancelled': return 'bg-slate-400 border-slate-500';
    case 'no_show': return 'bg-red-500 border-red-600';
  }
}

export function statusLabel(status: Appointment['status']): string {
  return {
    planned: 'Запланировано',
    done: 'Выполнено',
    cancelled: 'Отменено',
    no_show: 'Не пришёл',
  }[status];
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function overlapText(durationMin: number) {
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}