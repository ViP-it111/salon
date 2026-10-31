import { useMemo, useState } from 'react';
import { useDB } from '../store';
import { Card, Button, Input } from '../components/UI';
import { fmtMoney, downloadCSV, startOfDay, addDays, dateKey } from '../utils';

export default function Reports() {
  const { db } = useDB();
  const [from, setFrom] = useState(() => {
    const d = startOfDay(new Date()); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const inRange = useMemo(() => {
    const fromT = new Date(from + 'T00:00').getTime();
    const toT = new Date(to + 'T23:59').getTime();
    return db.appointments.filter((a) => {
      const t = new Date(a.start_datetime).getTime();
      return t >= fromT && t <= toT;
    });
  }, [db.appointments, from, to]);

  const done = inRange.filter((a) => a.status === 'done');
  const revenue = done.reduce((s, a) => s + a.price_final, 0);
  const canceled = inRange.filter((a) => a.status === 'cancelled').length;
  const noShow = inRange.filter((a) => a.status === 'no_show').length;

  const byMaster = db.masters.map((m) => {
    const list = done.filter((a) => a.master_id === m.id);
    return { m, count: list.length, sum: list.reduce((s, a) => s + a.price_final, 0) };
  }).sort((a, b) => b.sum - a.sum);

  const byProcedure = db.procedures.map((p) => {
    const list = done.filter((a) => a.procedure_id === p.id);
    return { p, count: list.length, sum: list.reduce((s, a) => s + a.price_final, 0) };
  }).filter((x) => x.count > 0).sort((a, b) => b.sum - a.sum);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ['Дата', 'Клиент', 'Мастер', 'Процедура', 'Статус', 'Оплата', 'Сумма'],
      ...inRange.map((a) => [
        new Date(a.start_datetime).toLocaleString('ru-RU'),
        db.clients.find((c) => c.id === a.client_id)?.full_name ?? '—',
        db.masters.find((m) => m.id === a.master_id)?.full_name ?? '—',
        db.procedures.find((p) => p.id === a.procedure_id)?.name ?? '—',
        a.status,
        a.payment_method ?? '',
        a.price_final,
      ]),
    ];
    downloadCSV(`report_${from}_${to}.csv`, rows);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Отчёты</h1>

      <Card className="p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <Input label="С" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="По" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="ghost" onClick={exportCSV}>Экспорт CSV</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-slate-500">Выручка</div><div className="text-2xl font-bold text-emerald-600">{fmtMoney(revenue)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Выполнено</div><div className="text-2xl font-bold">{done.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Отменено</div><div className="text-2xl font-bold text-slate-500">{canceled}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Не пришли</div><div className="text-2xl font-bold text-red-600">{noShow}</div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">По мастерам</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-500"><tr><th className="text-left py-1">Мастер</th><th className="text-right py-1">Записей</th><th className="text-right py-1">Сумма</th></tr></thead>
          <tbody>
            {byMaster.map(({ m, count, sum }) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="py-1">{m.full_name}</td>
                <td className="py-1 text-right">{count}</td>
                <td className="py-1 text-right">{fmtMoney(sum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">По процедурам</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-500"><tr><th className="text-left py-1">Процедура</th><th className="text-right py-1">Кол-во</th><th className="text-right py-1">Сумма</th></tr></thead>
          <tbody>
            {byProcedure.map(({ p, count, sum }) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-1">{p.name}</td>
                <td className="py-1 text-right">{count}</td>
                <td className="py-1 text-right">{fmtMoney(sum)}</td>
              </tr>
            ))}
            {byProcedure.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">Нет выполненных записей</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}