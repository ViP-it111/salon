import { useMemo, useState } from 'react';
import { useDB } from '../store';
import { AppointmentForm } from '../components/AppointmentForm';
import { Button, Card } from '../components/UI';
import type { Appointment } from '../types';
import {
  addDays, dateKey, fmtTime, pad, startOfDay, statusColor, statusLabel, fmtMoney,
} from '../utils';

const SLOT = 30; // минут на строку

export default function Schedule() {
  const { db } = useDB();
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const openHour = db.settings.open_hour;
  const closeHour = db.settings.close_hour;

  const slots = useMemo(() => {
    const res: number[] = [];
    for (let m = openHour * 60; m < closeHour * 60; m += SLOT) res.push(m);
    return res;
  }, [openHour, closeHour]);

  const masters = db.masters.filter((m) => m.active);

  const dayAppointments = useMemo(() => {
    const key = dateKey(day);
    return db.appointments.filter((a) => dateKey(new Date(a.start_datetime)) === key);
  }, [db.appointments, day]);

  const clientName = (id: number) => db.clients.find((c) => c.id === id)?.full_name ?? '—';
  const procName = (id: number) => db.procedures.find((p) => p.id === id)?.name ?? '—';

  const openNew = () => {
    setEditing(null);
    const d = new Date(day);
    d.setHours(openHour, 0, 0, 0);
    setFormOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFormOpen(true);
  };

  const dayTotal = dayAppointments
    .filter((a) => a.status === 'done')
    .reduce((s, a) => s + a.price_final, 0);

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Button variant="ghost" onClick={() => setDay(addDays(day, -1))}>← Вчера</Button>
        <Button variant="ghost" onClick={() => setDay(startOfDay(new Date()))}>Сегодня</Button>
        <Button variant="ghost" onClick={() => setDay(addDays(day, 1))}>Завтра →</Button>
        <div className="font-semibold text-lg ml-2">
          {day.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-500">Выполнено за день: <b>{fmtMoney(dayTotal)}</b></span>
          <Button onClick={openNew}>+ Новая запись</Button>
        </div>
      </div>

      <Card className="overflow-auto">
        <div className="min-w-[700px]">
          {/* Шапка */}
          <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
            <div className="w-16 shrink-0 px-2 py-2 text-xs text-slate-400">Время</div>
            {masters.map((m) => (
              <div key={m.id} className="flex-1 min-w-[180px] px-3 py-2 text-sm font-medium border-l border-slate-200">
                {m.full_name}
                <div className="text-xs text-slate-400 font-normal">{m.specialization}</div>
              </div>
            ))}
          </div>

          {/* Сетка */}
          <div className="relative flex">
            <div className="w-16 shrink-0">
              {slots.map((m) => (
                <div key={m} className="h-10 px-2 text-xs text-slate-400 border-b border-slate-100">
                  {pad(Math.floor(m / 60))}:{pad(m % 60)}
                </div>
              ))}
            </div>
            {masters.map((master) => {
              const appts = dayAppointments.filter((a) => a.master_id === master.id);
              return (
                <div key={master.id} className="flex-1 min-w-[180px] border-l border-slate-200 relative">
                  {slots.map((m) => (
                    <div
                      key={m}
                      className="h-10 border-b border-slate-100 hover:bg-brand-50/40 cursor-pointer"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    />
                  ))}
                  {appts.map((a) => {
                    const s = new Date(a.start_datetime);
                    const e = new Date(a.end_datetime);
                    const dayStart = new Date(day);
                    dayStart.setHours(openHour, 0, 0, 0);
                    const top = ((s.getTime() - dayStart.getTime()) / 60000 / SLOT) * 40;
                    const height = ((e.getTime() - s.getTime()) / 60000 / SLOT) * 40;
                    return (
                      <button
                        key={a.id}
                        onClick={(ev) => { ev.stopPropagation(); openEdit(a); }}
                        className={`absolute left-1 right-1 rounded-lg text-white text-xs p-1.5 text-left overflow-hidden shadow border ${statusColor(a.status)}`}
                        style={{ top: Math.max(top, 0), height: Math.max(height, 24) }}
                        title={`${clientName(a.client_id)} — ${procName(a.procedure_id)}`}
                      >
                        <div className="font-semibold truncate">{fmtTime(a.start_datetime)} {clientName(a.client_id)}</div>
                        <div className="truncate opacity-90">{procName(a.procedure_id)}</div>
                        <div className="truncate opacity-75">{statusLabel(a.status)}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <AppointmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        defaultDate={day}
      />
    </div>
  );
}