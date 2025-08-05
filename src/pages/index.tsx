import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

export default function Index() {

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

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
    } else {
      router.push('/home');
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login failed');
    } else {
      router.push('/home');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Simple AI Macro Tracker</h1>

        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm('create')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create Account
            </button>
            <button
              onClick={() => setShowForm('login')}
              className="bg-gray-600 text-white px-6 py-2 rounded mt-2 hover:bg-gray-700"
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
                className="border px-4 py-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Name"
                className="border px-4 py-2 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border px-4 py-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={handleCreateUser}
                disabled={loading || !email || !password}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 underline"
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
                className="border px-4 py-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border px-4 py-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 underline"
            >
              Cancel
            </button>
          </>
        )}

        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </main>
  );
}



export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (token) {
      try {
        jwt.verify(token, JWT_SECRET);
        return {
          redirect: {
            destination: '/home',
            permanent: false,
          },
        };
      } catch {
        // invalid token, allow access
      }
    }
  }

  return { props: {} };
};
