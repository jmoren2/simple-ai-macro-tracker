import Navbar from '@/components/Navbar';
import { User } from '@/types/db/User';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevtoken';

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
