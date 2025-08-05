// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md mb-6">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-xl font-semibold text-gray-800">🥦 Macro Tracker</div>
                <div className="space-x-4">
                    <Link href="/home" className="text-gray-700 hover:text-blue-600">
                        Home
                    </Link>
                    <Link href="/logs" className="text-gray-700 hover:text-blue-600">
                        Daily Logs
                    </Link>
                    <Link href="/logout" className="text-red-600 hover:text-red-800">
                        Logout
                    </Link>
                </div>
            </div>
        </nav>
    );
}
