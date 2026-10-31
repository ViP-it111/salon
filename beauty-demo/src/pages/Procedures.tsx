import { useState } from 'react';
import { useDB, nextId } from '../store';
import { Button, Card, Input } from '../components/UI';
import { Modal } from '../components/Modal';
import type { Procedure } from '../types';
import { fmtMoney, overlapText } from '../utils';

export default function Procedures() {
  const { db, update } = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const openNew = () => {
    setEditing(null);
    setName(''); setDuration(60); setPrice(0); setDescription(''); setActive(true);
    setOpen(true);
  };

  const openEdit = (p: Procedure) => {
    setEditing(p);
    setName(p.name); setDuration(p.duration_min); setPrice(p.price);
    setDescription(p.description ?? ''); setActive(p.active);
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    update((draft) => {
      if (editing) {
        const p = draft.procedures.find((x) => x.id === editing.id);
        if (p) {
          p.name = name.trim();
          p.duration_min = duration;
          p.price = price;
          p.description = description.trim() || undefined;
          p.active = active;
        }
      } else {
        draft.procedures.push({
          id: nextId(draft, 'procedures'),
          name: name.trim(),
          duration_min: duration,
          price,
          description: description.trim() || undefined,
          active,
        });
      }
    });
    setOpen(false);
  };

  const remove = (id: number) => {
    if (!confirm('Удалить процедуру?')) return;
    update((draft) => { draft.procedures = draft.procedures.filter((p) => p.id !== id); });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold">Процедуры</h1>
        <Button className="ml-auto" onClick={openNew}>+ Добавить</Button>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-4 py-2">Название</th>
              <th className="text-left px-4 py-2">Длительность</th>
              <th className="text-right px-4 py-2">Цена</th>
              <th className="text-left px-4 py-2">Статус</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {db.procedures.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-slate-400">{p.description}</div>}
                </td>
                <td className="px-4 py-2">{overlapText(p.duration_min)}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(p.price)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.active ? 'активна' : 'скрыта'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-slate-600 hover:underline mr-3" onClick={() => openEdit(p)}>Изменить</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(p.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} title={editing ? 'Редактировать процедуру' : 'Новая процедура'} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Длительность, мин"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <Input
              label="Цена, ₽"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <Input label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Активна (доступна для записи)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}ы