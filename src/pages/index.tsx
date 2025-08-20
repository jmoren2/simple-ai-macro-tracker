import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Index(props: { apiUrl: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState<'create' | 'login' | false>(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(`${props.apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create account');
      }

      // Cookie is set by backend → user is logged in
      if (router.pathname !== '/home') {
        router.push('/home');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiFetch(`${props.apiUrl}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      if (router.pathname !== '/home') {
        router.push('/home');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div
        className="shadow-lg rounded-lg p-6 w-full max-w-md text-center"
        style={{ backgroundColor: '#2c2c2c' }} // brand.surface
      >
        <h1 className="text-2xl font-bold mb-4">Macro AI</h1>
        <p className="mb-4">A simple AI macro tracker</p>

        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm('create')}
              className="w-full px-6 py-2 rounded mb-2"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Create Account
            </button>
            <button
              onClick={() => setShowForm('login')}
              className="w-full px-6 py-2 rounded"
              style={{ backgroundColor: '#444', color: 'white' }}
            >
              Login
            </button>
          </>
        ) : showForm === 'create' ? (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="email"
                placeholder="Email"
                className="border px-4 py-2 rounded bg-black text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Name"
                className="border px-4 py-2 rounded bg-black text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border px-4 py-2 rounded bg-black text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={handleCreateUser}
                disabled={loading || !email || !password}
                className="px-6 py-2 rounded disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-400 underline"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="email"
                placeholder="Email"
                className="border px-4 py-2 rounded bg-black text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border px-4 py-2 rounded bg-black text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="px-6 py-2 rounded disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-400 underline"
            >
              Cancel
            </button>
          </>
        )}

        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const apiUrl = process.env.SHTAI_API_URL;
  const res = await apiFetch(`${apiUrl}/user/me`, {
    headers: { cookie: req.headers.cookie ?? '' }
  });

  const user = await res.json() as User | null;
  if (user) {
    return { redirect: { destination: '/home', permanent: false } };
  }

  return {
    props: {
      apiUrl,
    }
  };
};
