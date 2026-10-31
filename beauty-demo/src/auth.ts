import type { User } from './types';
import { loadDB, saveDB } from './store';

const SESSION_KEY = 'beauty_salon_session';

// ДЕМО: sha-256 через Web Crypto. Настоящий bcrypt — на сервере.
export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensureDefaultAdmin() {
  const db = loadDB();
  if (db.users.length === 0) {
    db.users.push({
      username: 'admin',
      passwordHash: await sha256('admin123'),
      role: 'admin',
    });
    saveDB(db);
  }
}

export async function login(username: string, password: string): Promise<User | null> {
  const db = loadDB();
  const hash = await sha256(password);
  const user = db.users.find(
    (u) => u.username === username && u.passwordHash === hash,
  );
  if (!user) return null;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, role: user.role }));
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent('auth-changed'));
}

export function currentUser(): { username: string; role: string } | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function changePassword(oldPwd: string, newPwd: string): Promise<string | null> {
  const session = currentUser();
  if (!session) return 'Не авторизован';
  const db = loadDB();
  const user = db.users.find((u) => u.username === session.username);
  if (!user) return 'Пользователь не найден';
  if (user.passwordHash !== (await sha256(oldPwd))) return 'Старый пароль неверный';
  user.passwordHash = await sha256(newPwd);
  saveDB(db);
  return null;
}