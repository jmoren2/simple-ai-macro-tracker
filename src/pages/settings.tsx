'use client';

import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';
import { useState } from 'react';

type Props = {
  user: User;
  apiUrl: string;
};

export default function Settings({ user, apiUrl }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleUpdate = async () => {
    if (password && password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    const res = await apiFetch(`${apiUrl}/user/me`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Update failed.');
    } else {
      setStatus('Update successful!');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4">
      <Navbar />
      <div className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-6 shadow-md mt-6" style={{ backgroundColor: '#2c2c2c' }}>
        <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">Settings</h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black text-white px-4 py-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black text-white px-4 py-2 rounded"
          />
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black text-white px-4 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black text-white px-4 py-2 rounded"
          />
          <button
            className="w-full py-2 text-white rounded"
            style={{ backgroundColor: '#f97316' }}
            onClick={handleUpdate}
          >
            Update Info
          </button>
          {status && <p className="text-sm text-center mt-2 text-gray-300">{status}</p>}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const apiUrl = process.env.SHTAI_API_URL;
  const meRes = await apiFetch(`${apiUrl}/user/me`, {
    headers: { cookie: req.headers.cookie ?? '' }
  });
  if (meRes.status !== 200) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = await meRes.json() as User | null;
    if (!user) {
      console.log('User not found');
      return { redirect: { destination: '/', permanent: false } };
    }
    return { props: { user, apiUrl } };
  } catch (err) {
    console.log(err);
    return { redirect: { destination: '/', permanent: false } };
  }
};
