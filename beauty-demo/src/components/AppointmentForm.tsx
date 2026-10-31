import { useEffect, useMemo, useState } from 'react';
import { useDB, nextId } from '../store';
import type { Appointment, AppointmentStatus } from '../types';
import { Button, Input, Select } from './UI';
import { findConflicts, toLocalISO } from '../utils';

export function AppointmentForm({
  open, onClose, editing, defaultDate,
  defaultMasterId, defaultStart,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Appointment | null;
  defaultDate?: Date;
  defaultMasterId?: number;
  defaultStart?: Date;
}) {
  const { db, update } = useDB();

  const [clientId, setClientId] = useState<number | ''>('');
  const [masterId, setMasterId] = useState<number | ''>('');
  const [procedureId, setProcedureId] = useState<number | ''>('');
  const [start, setStart] = useState<string>('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('planned');
  const [price, setPrice] = useState<number>(0);
  const [payment, setPayment] = useState<'cash' | 'card' | 'none'>('none');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setNewClientMode(false);
    setSearch('');
    if (editing) {
      setClientId(editing.client_id);
      setMasterId(editing.master_id);
      setProcedureId(editing.procedure_id);
      setStart(toLocalISO(new Date(editing.start_datetime)));
      setComment(editing.comment ?? '');
      setStatus(editing.status);
      setPrice(editing.price_final);
      setPayment((editing.payment_method as any) ?? 'none');
    } else {
      const base = defaultDate ? new Date(defaultDate) : new Date();
      base.setSeconds(0, 0);
      base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15);
      setClientId('');
      setMasterId('');
      setProcedureId('');
      setStart(toLocalISO(base));
      setComment('');
      setStatus('planned');
      setPrice(0);
      setPayment('none');
    }
  }, [open, editing, defaultDate]);

  const proc = db.procedures.find((p) => p.id === procedureId);

  useEffect(() => {
    if (proc) setPrice(proc.price);
  }, [proc?.id]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return db.clients.slice(0, 8);
    return db.clients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q),
    ).slice(0, 8);
  }, [db.clients, search]);

  const submit = () => {
    setError('');
    if (!masterId) return setError('Выберите мастера');
    if (!procedureId) return setError('Выберите процедуру');
    if (!start) return setError('Укажите дату и время');

    let cid = clientId as number;

    if (newClientMode) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        return setError('Укажите имя и телефон нового клиента');
      }
    } else if (!cid) {
      return setError('Выберите клиента или создайте нового');
    }

    if (!proc) return setError('Процедура не найдена');
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return setError('Некорректная дата');

    const conflicts = findConflicts(db, masterId as number, startDate.toISOString(), proc.duration_min, editing?.id);
    if (conflicts.length > 0) {
      return setError('Пересечение с другой записью этого мастера. Выберите другое время.');
    }

    const end = new Date(startDate.getTime() + proc.duration_min * 60000);

    update((draft) => {
      if (newClientMode) {
        cid = nextId(draft, 'clients');
        draft.clients.push({
          id: cid,
          full_name: newClientName.trim(),
          phone: newClientPhone.trim(),
          created_at: new Date().toISOString(),
        });
      }

      if (editing) {
        const a = draft.appointments.find((x) => x.id === editing.id);
        if (!a) return;
        a.client_id = cid;
        a.master_id = masterId as number;
        a.procedure_id = procedureId as number;
        a.start_datetime = startDate.toISOString();
        a.end_datetime = end.toISOString();
        a.comment = comment;
        a.status = status;
        a.price_final = Number(price) || proc.price;
        a.payment_method = payment;
      } else {
        draft.appointments.push({
          id: nextId(draft, 'appointments'),
          client_id: cid,
          master_id: masterId as number,
          procedure_id: procedureId as number,
          start_datetime: startDate.toISOString(),
          end_datetime: end.toISOString(),
          status,
          price_final: Number(price) || proc.price,
          payment_method: payment,
          comment,
        });
      }
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">{editing ? 'Редактировать запись' : 'Новая запись'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</div>}

          {/* Клиент */}
          {!newClientMode ? (
            <>
              <Input
                label="Поиск клиента (имя или телефон)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Начните вводить..."
              />
              <Select
                label="Клиент"
                value={clientId}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">— выберите —</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} · {c.phone}</option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setNewClientMode(true)}
                className="text-sm text-brand-600 hover:underline"
              >
                + Новый клиент
              </button>
            </>
          ) : (
            <div className="space-y-3 border border-slate-200 rounded p-3 bg-slate-50">
              <div className="text-sm font-medium">Новый клиент</div>
              <Input label="Имя" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
              <Input label="Телефон" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
              <button
                type="button"
                onClick={() => setNewClientMode(false)}
                className="text-sm text-slate-500 hover:underline"
              >
                ← Выбрать существующего
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select label="Мастер" value={masterId} onChange={(e) =>  (e.target.value ? Number(e.target.value) : '')}>
              <option value="">— выберите —</option>
              {db.masters.filter((m) => m.active).map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </Select>

            <Select label="Процедура" value={procedureId} onChange={(e) => setProcedureId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— выберите —</option>
              {db.procedures.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          {proc && (
            <div className="text-sm text-slate-500">
              Длительность: <b>{proc.duration_min} мин</b> · Цена: <b>{proc.price} ₽</b>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Дата и время"
              type="datetime-local"
              step={900}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <Input  
              label="Итоговая цена, ₽"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Статус" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
              <option value="planned">Запланировано</option>
              <option value="done">Выполнено</option>
              <option value="cancelled">Отменено</option>
              <option value="no_show">Не пришёл</option>
            </Select>
            <Select label="Оплата" value={payment} onChange={(e) => setPayment(e.target.value as any)}>
              <option value="none">— не указана —</option>
              <option value="cash">Наличные</option>
              <option value="card">Карта</option>
            </Select>
          </div>

          <Input
            label="Комментарий"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Пожелания клиента..."
          />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit}>{editing ? 'Сохранить' : 'Создать запись'}</Button>
        </div>
      </div>
    </div>
  );
}