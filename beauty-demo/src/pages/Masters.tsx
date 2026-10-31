import { useState } from 'react';
import { useDB, nextId } from '../store';
import { Button, Card, Input } from '../components/UI';
import { Modal } from '../components/Modal';
import type { Master } from '../types';

export default function Masters() {
  const { db, update } = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Master | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [spec, setSpec] = useState('');
  const [active, setActive] = useState(true);

  const openNew = () => {
    setEditing(null);
    setName(''); setPhone(''); setSpec(''); setActive(true);
    setOpen(true);
  };

  const openEdit = (m: Master) => {
    setEditing(m);
    setName(m.full_name); setPhone(m.phone ?? '');
    setSpec(m.specialization ?? ''); setActive(m.active);
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    update((draft) => {
      if (editing) {
        const m = draft.masters.find((x) => x.id === editing.id);
        if (m) {
          m.full_name = name.trim();
          m.phone = phone.trim() || undefined;
          m.specialization = spec.trim() || undefined;
          m.active = active;
        }
      } else {
        draft.masters.push({
          id: nextId(draft, 'masters'),
          full_name: name.trim(),
          phone: phone.trim() || undefined,
          specialization: spec.trim() || undefined,
          active,
        });
      }
    });
    setOpen(false);
  };

  const remove = (id: number) => {
    const hasAppts = db.appointments.some((a) => a.master_id === id);
    if (hasAppts && !confirm('У мастера есть записи. Скрыть его вместо удаления?')) {
      update((draft) => {
        const m = draft.masters.find((x) => x.id === id);
        if (m) m.active = false;
      });
      return;
    }
    if (!hasAppts && !confirm('Удалить мастера?')) return;
    update((draft) => { draft.masters = draft.masters.filter((m) => m.id !== id); });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold">Мастера</h1>
        <Button className="ml-auto" onClick={openNew}>+ Добавить</Button>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2">Имя</th>
              <th className="text-left px-4 py-2">Специализация</th>
              <th className="text-left px-4 py-2">Телефон</th>
              <th className="text-left px-4 py-2">Статус</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {db.masters.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{m.full_name}</td>
                <td className="px-4 py-2">{m.specialization ?? '—'}</td>
                <td className="px-4 py-2">{m.phone ?? '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${m.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {m.active ? 'активен' : 'скрыт'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-slate-600 hover:underline mr-3" onClick={() => openEdit(m)}>Изменить</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(m.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} title={editing ? 'Редактировать мастера' : 'Новый мастер'} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Специализация" value={spec} onChange={(e) => setSpec(e.target.value)} />
          <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Активен (доступен для записи)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}