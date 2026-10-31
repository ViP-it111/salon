import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout, currentUser } from '../auth';

const links = [
  { to: '/', label: 'Расписание', end: true },
  { to: '/clients', label: 'Клиенты' },
  { to: '/procedures', label: 'Процедуры' },
  { to: '/masters', label: 'Мастера' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/settings', label: 'Настройки' },
];

export function Layout() {
  const nav = useNavigate();
  const user = currentUser();
  return (
    <div className="h-full flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-4">
        <div className="font-bold text-brand-700 text-lg">💅 Beauty Demo</div>
        <nav className="flex gap-1 overflow-x-auto flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-sm text-slate-500 flex items-center gap-3">
          <span>{user?.username}</span>
          <button
            onClick={() => { logout(); nav('/login'); }}
            className="text-slate-500 hover:text-red-600"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}