import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';

type Props = {
    user: User;
};

export default function Pricing({ user }: Props) {
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4">
            <Navbar />
            <div className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-4 shadow-md mt-6" style={{ backgroundColor: '#2c2c2c' }}>
                <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">Pricing</h1>
            </div>
        </div >
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
        return { props: { user } };
    } catch (err) {
        console.log(err);

        return { redirect: { destination: '/', permanent: false } };
    }
};
