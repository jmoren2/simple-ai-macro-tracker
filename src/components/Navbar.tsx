'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiChevronDown, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar({ loggedOut = false }: { loggedOut?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (loggedOut) {
        return (
            <>
                {/* Hamburger button fixed to top-left */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 z-50 p-2 rounded-lg text-2xl"
                    style={{ backgroundColor: '#2c2c2c', color: 'var(--foreground)' }}
                    aria-label="Open menu"
                >
                    <FiMenu />
                </button>

                {/* Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={() => setIsOpen(false)}
                    />
                )}

                {/* Side drawer */}
                <div
                    className="fixed top-0 left-0 h-full w-56 z-50 flex flex-col p-6 shadow-xl transition-transform duration-200"
                    style={{
                        backgroundColor: '#2c2c2c',
                        color: 'var(--foreground)',
                        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" onClick={() => setIsOpen(false)}>
                            <Image src="/logo.svg" alt="" width={100} height={26} />
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-2xl"
                            aria-label="Close menu"
                        >
                            <FiX />
                        </button>
                    </div>
                    <nav className="flex flex-col gap-4">
                        <Link
                            href="/pricing"
                            className="hover:text-orange-400"
                            onClick={() => setIsOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/about"
                            className="hover:text-orange-400"
                            onClick={() => setIsOpen(false)}
                        >
                            About
                        </Link>
                    </nav>
                </div>
            </>
        );
    }

    return (
        <nav
            className="sticky top-0 z-50 shadow-md"
            style={{
                backgroundColor: '#2c2c2c',
                color: 'var(--foreground)',
            }}
        >
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/home" className="flex items-center space-x-2">
                    <Image src="/logo.svg" alt="" width={125} height={32} />
                </Link>

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
                <div className="hidden sm:flex space-x-4 items-center">
                    <Link href="/home" className="hover:text-orange-400">
                        Home
                    </Link>
                    <Link href="/logs" className="hover:text-orange-400">
                        Daily Logs
                    </Link>
                    <Link href="/calendar" className="hover:text-orange-400">
                        Calendar
                    </Link>

                    {/* Dropdown trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="hover:text-orange-400 flex items-center space-x-1"
                        >
                            <span>More</span>
                            <FiChevronDown />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-[#1a1a1a] border border-gray-700 rounded-md shadow-lg z-50">
                                <Link
                                    href="/settings"
                                    className="block px-4 py-2 hover:bg-[#2a2a2a] text-sm"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    Settings
                                </Link>
                            </div>
                        )}
                    </div>

                    <Link href="/logout" className="text-orange-400 hover:text-red-400">
                        Logout
                    </Link>
                </div>
            </div>

            {/* Mobile nav */}
            {isOpen && (
                <div className="sm:hidden px-4 pb-3 flex flex-col space-y-2">
                    <Link
                        href="/home"
                        className="hover:text-orange-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        href="/logs"
                        className="hover:text-orange-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Daily Logs
                    </Link>
                    <Link
                        href="/calendar"
                        className="hover:text-orange-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Calendar
                    </Link>
                    <Link
                        href="/assistant"
                        className="hover:text-orange-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Macro Assistant
                    </Link>
                    <Link
                        href="/settings"
                        className="hover:text-orange-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Settings
                    </Link>
                    <Link
                        href="/logout"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => setIsOpen(false)}
                    >
                        Logout
                    </Link>
                </div>
            )}
        </nav>
    );
}
