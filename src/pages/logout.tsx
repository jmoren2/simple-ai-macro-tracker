// pages/logout.tsx
import { apiFetch } from '@/utils/api';
import { setCookie } from 'cookies-next';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res, req }) => {
  await apiFetch(`${process.env.SHTAI_API_URL!}/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: req.headers.cookie || '', // forward incoming cookies
    },
  });

  setCookie('SHTAIToken', '', {
    req,
    res,
    maxAge: -1, // Set cookie to expire immediately
  });

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
};

export default function Logout() {
  return null; // This page will never actually render
}
