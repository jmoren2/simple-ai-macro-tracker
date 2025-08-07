import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import Link from 'next/link';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

type Props = {
    user: User;
};

export default function Logs({ user }: Props) {
    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4">
            <Navbar />
            <div className="max-w-2xl mx-auto bg-brand-surface rounded-xl p-4 shadow-md mt-6" style={{ backgroundColor: '#2c2c2c' }}>
                <h1 className="text-2xl font-bold text-center mb-6 text-brand-accent">Macro AI Assistant</h1>
                {!user.isPremium ? (
                    <p className="text-center">
                        You are not a premium user!<br />
                        Upgrade to use the AI Assistant feature <Link className='text-decoration: underline' href="/pricing">here</Link>.
                    </p>
                ) : (
                    <p className="text-center">🤖AI Assistant coming soon...🤖</p>
                )}
            </div>
        </div >
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
        user.isPremium = false;
        return { props: { user } };
    } catch (err) {
        console.log(err);

        return { redirect: { destination: '/', permanent: false } };
    }
};
