import { cookies } from 'next/headers'

const AUTH_COOKIE = 'tp_admin'
const SESSION_DURATION = 60 * 60 * 24 // 24 hours in seconds

export function setAdminCookie() {
  cookies().set(AUTH_COOKIE, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export function clearAdminCookie() {
  cookies().delete(AUTH_COOKIE)
}

export function isAdminAuthenticated(): boolean {
  return cookies().get(AUTH_COOKIE)?.value === 'true'
}
