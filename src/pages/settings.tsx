'use client';

import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import { useState } from 'react';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type Props = {
  user: User;
};

export default function Settings({ user }: Props) {
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

    const res = await fetch('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const token = req.cookies?.macroAIToken;
  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as User;
    if (!user) {
      return { redirect: { destination: '/', permanent: false } };
    }
    return { props: { user } };
  } catch (err) {
    console.log(err);
    return { redirect: { destination: '/', permanent: false } };
  }
};
