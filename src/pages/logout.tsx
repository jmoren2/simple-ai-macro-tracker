// pages/logout.tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');

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
