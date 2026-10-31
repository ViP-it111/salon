import { useMemo, useState } from 'react';
import { useDB, nextId } from '../store';
import { Button, Card, Input, Select } from '../components/UI';
import { Modal } from '../components/Modal';
import type { Client } from '../types';
import { fmtMoney, fmtTime } from '../utils';

export default function Clients() {
  const { db, update } = useDB();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [historyFor, setHistoryFor] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return db.clients;
    return db.clients.filter(
      (c) => c.full_name.toLowerCase().includes(s) || c.phone.includes(s),
    );
  }, [db.clients, q]);

  const openNew = () => {
    setEditing(null);
    setName(''); setPhone(''); setEmail(''); setNotes('');
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setName(c.full_name); setPhone(c.phone); setEmail(c.email ?? ''); setNotes(c.notes ?? '');
    setOpen(true);
  };

  const save = () => {
    if (!name.trim() || !phone.trim()) return;
    update((draft) => {
      if (editing) {
        const c = draft.clients.find((x) => x.id === editing.id);
        if (c) {
          c.full_name = name.trim();
          c.phone = phone.trim();
          c.email = email.trim() || undefined;
          c.notes = notes.trim() || undefined;
        }
      } else {
        draft.clients.push({
          id: nextId(draft, 'clients'),
          full_name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          created_at: new Date().toISOString(),
        });
      }
    });
    setOpen(false);
  };

  const remove = (id: number) => {
    if (!confirm('Удалить клиента? Записи сохранятся, но клиент станет недоступен в списке.')) return;
    update((draft) => {
      draft.clients = draft.clients.filter((c) => c.id !== id);
    });
  };

  const history = historyFor
    ? db.appointments
        .filter((a) => a.client_id === historyFor.id)
        .sort((a, b) => b.start_datetime.localeCompare(a.start_datetime))
    : [];

  const procName = (id: number) => db.procedures.find((p) => p.id === id)?.name ?? '—';
  const masterName = (id: number) => db.masters.find((m) => m.id === id)?.full_name ?? '—';

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-xl font-bold">Клиенты</h1>
        <div className="ml-auto flex gap-2 items-center">
          <Input placeholder="Поиск: имя или телефон" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={openNew}>+ Добавить</Button>
        </div>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2">Имя</th>
              <th className="text-left px-4 py-2">Телефон</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-right px-4 py-2">Записей</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const count = db.appointments.filter((a) => a.client_id === c.id).length;
              return (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{c.full_name}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2 text-slate-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{count}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-brand-600 hover:underline mr-3" onClick={() => setHistoryFor(c)}>История</button>
                    <button className="text-slate-600 hover:underline mr-3" onClick={() => openEdit(c)}>Изменить</button>
                    <button className="text-red-600 hover:underline" onClick={() => remove(c.id)}>Удалить</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Клиенты не найдены</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={open} title={editing ? 'Редактировать клиента' : 'Новый клиент'} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!historyFor}
        title={`История: ${historyFor?.full_name ?? ''}`}
        onClose={() => setHistoryFor(null)}
        wide
      >
        {history.length === 0 ? (
          <p className="text-slate-400">Записей нет</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left py-1">Дата</th>
                <th className="text-left py-1">Процедура</th>
                <th className="text-left py-1">Мастер</th>
                <th className="text-right py-1">Сумма</th>
                <th className="text-left py-1">Статус</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="py-1">{new Date(a.start_datetime).toLocaleDateString('ru-RU')} {fmtTime(a.start_datetime)}</td>
                  <td className="py-1">{procName(a.procedure_id)}</td>
                  <td className="py-1">{masterName(a.master_id)}</td>
                  <td className="py-1 text-right">{fmtMoney(a.price_final)}</td>
                  <td className="py-1">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}