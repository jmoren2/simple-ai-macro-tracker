import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type AssistantResponse = {
    message: string;
    options: string[] | null;
    done: boolean;
    result: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    } | null;
};

type Props = {
    user: User;
    apiUrl: string;
};

export default function Assistant({ user, apiUrl }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [options, setOptions] = useState<string[] | null>(null);
    const [result, setResult] = useState<AssistantResponse['result']>(null);
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, options]);

    async function sendMessage(updatedMessages: Message[]) {
        setLoading(true);
        setOptions(null);
        try {
            const res = await apiFetch(`${apiUrl}/analyze/assistant`, {
                method: 'POST',
                body: JSON.stringify({ messages: updatedMessages }),
            });
            const data = (await res.json()) as AssistantResponse;

            const assistantMessage: Message = { role: 'assistant', content: data.message };
            setMessages((prev) => [...prev, assistantMessage]);
            setOptions(data.options);
            if (data.done && data.result) setResult(data.result);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Something went wrong. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function handleStart() {
        setStarted(true);
        sendMessage([]);
    }

    function handleOption(option: string) {
        const userMessage: Message = { role: 'user', content: option };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        sendMessage(updatedMessages);
    }

    function handleReset() {
        setMessages([]);
        setOptions(null);
        setResult(null);
        setStarted(false);
    }

    if (!user.isPremium) {
        return (
            <div
                className="min-h-screen p-4"
                style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
                <Navbar />
                <div
                    className="max-w-2xl mx-auto rounded-xl p-6 shadow-md mt-6 text-center"
                    style={{ backgroundColor: '#2c2c2c' }}
                >
                    <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
                        Macro AI Assistant
                    </h1>
                    <p>
                        You are not a premium user!
                        <br />
                        Upgrade to use the AI Assistant feature{' '}
                        <Link href="/pricing" className="underline">
                            here
                        </Link>
                        .
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen p-4"
            style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
            <Navbar />
            <div
                className="max-w-2xl mx-auto mt-6 flex flex-col"
                style={{ height: 'calc(100vh - 120px)' }}
            >
                <div
                    className="rounded-xl shadow-md flex flex-col flex-1 overflow-hidden"
                    style={{ backgroundColor: '#2c2c2c' }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                            🤖 Macro AI Assistant
                        </h1>
                        {started && (
                            <button
                                onClick={handleReset}
                                className="text-sm text-gray-400 hover:text-white underline"
                            >
                                Start over
                            </button>
                        )}
                    </div>

                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {!started ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                                <p className="text-gray-300 text-lg">
                                    I&apos;ll ask you a few quick questions to calculate your
                                    personalized daily macro targets.
                                </p>
                                <button
                                    onClick={handleStart}
                                    className="px-6 py-3 rounded-xl text-white font-semibold"
                                    style={{ backgroundColor: 'var(--accent)' }}
                                >
                                    Let&apos;s go!
                                </button>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className="max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap"
                                            style={{
                                                backgroundColor:
                                                    msg.role === 'user'
                                                        ? 'var(--accent)'
                                                        : '#3a3a3a',
                                                color: 'white',
                                                borderBottomRightRadius:
                                                    msg.role === 'user' ? 4 : undefined,
                                                borderBottomLeftRadius:
                                                    msg.role === 'assistant' ? 4 : undefined,
                                            }}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div
                                            className="px-4 py-2 rounded-2xl text-sm"
                                            style={{
                                                backgroundColor: '#3a3a3a',
                                                borderBottomLeftRadius: 4,
                                            }}
                                        >
                                            <span className="animate-pulse">●●●</span>
                                        </div>
                                    </div>
                                )}

                                {result && (
                                    <div
                                        className="mt-4 p-4 rounded-xl border border-orange-500/40"
                                        style={{ backgroundColor: '#1f1f1f' }}
                                    >
                                        <p
                                            className="font-semibold mb-3 text-center"
                                            style={{ color: 'var(--accent)' }}
                                        >
                                            Your Daily Macro Targets
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    label: '🔥 Calories',
                                                    value: `${result.calories} kcal`,
                                                },
                                                {
                                                    label: '🍗 Protein',
                                                    value: `${result.protein}g`,
                                                },
                                                { label: '🍞 Carbs', value: `${result.carbs}g` },
                                                { label: '🥑 Fat', value: `${result.fat}g` },
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="rounded-lg p-3 text-center"
                                                    style={{ backgroundColor: '#2c2c2c' }}
                                                >
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        {label}
                                                    </p>
                                                    <p className="font-bold text-lg">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </>
                        )}
                    </div>

                    {/* Options */}
                    {options && !loading && (
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {options.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleOption(opt)}
                                        className="px-4 py-2 rounded-xl text-sm border border-gray-600 hover:border-orange-500 hover:text-white transition-colors"
                                        style={{ backgroundColor: '#1f1f1f' }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const apiUrl = process.env.SHTAI_API_URL;
    const meRes = await apiFetch(`${apiUrl}/user/me`, {
        headers: { cookie: req.headers.cookie ?? '' },
    });
    if (meRes.status !== 200) {
        return { redirect: { destination: '/', permanent: false } };
    }

    try {
        const user = (await meRes.json()) as User | null;
        if (!user) return { redirect: { destination: '/', permanent: false } };
        if (!user.isPremium) {
            return { redirect: { destination: '/', permanent: false } };
        }
        return { props: { user, apiUrl: '/api/backend' } };
    } catch {
        return { redirect: { destination: '/', permanent: false } };
    }
};
