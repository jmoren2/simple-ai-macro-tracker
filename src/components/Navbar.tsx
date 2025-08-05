'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 shadow-md"
      style={{
        backgroundColor: '#2c2c2c',
        color: 'var(--foreground)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">🥦 MacroAI </div>

        {/* Mobile toggle button */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-2xl"
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex space-x-4">
          <Link href="/home" className="hover:text-orange-400">Home</Link>
          <Link href="/logs" className="hover:text-orange-400">Daily Logs</Link>
          <Link href="/logout" className="text-orange-400 hover:text-red-400">Logout</Link>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="sm:hidden px-4 pb-3 flex flex-col space-y-2">
          <Link href="/home" className="hover:text-orange-400" onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="/logs" className="hover:text-orange-400" onClick={() => setIsOpen(false)}>Daily Logs</Link>
          <Link href="/logout" className="text-red-500 hover:text-red-400" onClick={() => setIsOpen(false)}>Logout</Link>
        </div>
      )}
    </nav>
  );
}
