import { apiFetch } from '@/utils/api';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Logout({ apiUrl }: { apiUrl: string }) {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                await apiFetch(`${apiUrl}/auth/logout`, {
                    method: 'POST',
                });
            } catch (e) {
                // ignore
            } finally {
                router.replace('/'); // go home either way
            }
        })();
    }, [router, apiUrl]);

    return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
    console.log('Logging out user...');
    return {
        props: { apiUrl: '/api/backend' }, // Pass the API URL
    };
};
