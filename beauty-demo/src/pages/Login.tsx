import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';
import { Button, Input, Card } from '../components/UI';

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const user = await login(username.trim(), password);
    setBusy(false);
    if (!user) return setError('Неверный логин или пароль');
    nav('/', { replace: true });
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">💅</div>
          <h1 className="text-xl font-bold text-brand-700">Beauty Demo</h1>
          <p className="text-sm text-slate-500">Вход в систему</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</div>}
          <Input label="Логин" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Вход...' : 'Войти'}
          </Button>
        </form>
        <p className="mt-4 text-xs text-center text-slate-400">
          Демо: admin / admin123
        </p>
      </Card>
    </div>
  );
}