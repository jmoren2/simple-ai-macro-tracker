import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';

type Props = {
    user: User | null;
};

export default function About({ user }: Props) {
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4">
            <Navbar loggedOut={!user} />
            <div
                className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-4 shadow-md mt-6"
                style={{ backgroundColor: '#2c2c2c' }}
            >
                <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">About</h1>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const apiUrl = process.env.SHTAI_API_URL;
    try {
        const meRes = await apiFetch(`${apiUrl}/user/me`, {
            headers: { cookie: req.headers.cookie ?? '' },
        });
        if (meRes.status !== 200) return { props: { user: null } };
        const user = (await meRes.json()) as User | null;
        return { props: { user: user ?? null } };
    } catch {
        return { props: { user: null } };
    }
};
