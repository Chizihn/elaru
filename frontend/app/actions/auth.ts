'use server';

import { cookies } from 'next/headers';

export async function loginAction(token: string) {
  (await cookies()).set('auth_token', token, {
    httpOnly: false, // Allow client-side access for Apollo Client
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function logoutAction() {
  (await cookies()).delete('auth_token');
}
