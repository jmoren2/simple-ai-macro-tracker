// pages/logout.tsx
import { apiFetch } from '@/utils/api';
import { setCookie } from 'cookies-next';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  try {
    console.log('Logging out user...');

    await apiFetch(`${process.env.SHTAI_API_URL!}/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: req.headers.cookie || '', // forward incoming cookies
      },
    });

    const isDeployed = process.env.ENV === 'prod' || process.env.ENV === 'stage';

    setCookie('SHTAIToken', '', {
      req,
      res,
      maxAge: -1, // Set cookie to expire immediately
      path: '/',
      secure: isDeployed, // Use secure cookies in production
      sameSite: isDeployed ? 'none' : 'lax', // Use lax SameSite policy
    });

    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  } catch (error) {
    console.error('Logout failed:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  };
};

export default function Logout() {
  return null; // This page will never actually render
}
